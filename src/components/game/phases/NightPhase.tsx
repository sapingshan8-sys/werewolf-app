"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  onValue,
  push,
  ref,
  set,
} from "firebase/database";
import { db } from "@/lib/firebase";

import Timer from "../common/Timer";
import WaitingOverlay from "../evening/WaitingOverlay";
import ChatInput from "../evening/ChatInput";

import type { Player } from "@/types/player";

type PlayerWithId = Player & {
  id: string;
};

type Message = {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  createdAt: number;
};

type Props = {
  roomCode: string;
  day: number;
  myPlayer: PlayerWithId;
  players: PlayerWithId[];
  lastEliminatedPlayer?: PlayerWithId;
  alreadyFinished?: boolean;
  gnosiaAttackTargetId?: string;
  onSelectGnosiaAttackTarget: (
    targetId: string
  ) => Promise<void>;
  onSubmitAction: (
    targetId?: string
  ) => Promise<void>;
};

const roleNames: Record<string, string> = {
  crew: "乗員",
  gnosia: "グノーシア",
  engineer: "エンジニア",
  doctor: "ドクター",
  guardianAngel: "守護天使",
  guardDuty: "留守番",
  acFollower: "AC主義者",
  bug: "バグ",
};

export default function NightPhase({
  roomCode,
  day,
  myPlayer,
  players,
  lastEliminatedPlayer,
  alreadyFinished = false,
  gnosiaAttackTargetId = "",
  onSelectGnosiaAttackTarget,
  onSubmitAction,
}: Props) {
  const [selectedId, setSelectedId] =
    useState("");
  const [waiting, setWaiting] =
    useState(alreadyFinished);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatSending, setIsChatSending] =
    useState(false);

  const alivePlayers = players.filter(
    (player) => player.alive !== false
  );
  const selectableTargets = alivePlayers.filter(
    (player) =>
      player.id !== myPlayer.id &&
      !(
        myPlayer.role === "gnosia" &&
        player.role === "gnosia"
      )
  );
  const displayedSelectedId =
    myPlayer.role === "gnosia"
      ? gnosiaAttackTargetId
      : selectedId;

  useEffect(() => {
    if (myPlayer.role !== "gnosia") {
      return;
    }

    const messagesRef = ref(
      db,
      `rooms/${roomCode}/gnosiaChats/${day}/messages`
    );

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setMessages([]);
        return;
      }

      const list: Message[] = Object.entries(data).map(
        ([id, value]) => ({
          id,
          ...(value as Omit<Message, "id">),
        })
      );

      list.sort((a, b) => a.createdAt - b.createdAt);

      setMessages(list);
    });

    return () => unsubscribe();
  }, [roomCode, day, myPlayer.role]);

  const sendGnosiaMessage = async (text: string) => {
    const trimmedText = text.trim();

    if (trimmedText === "") {
      return;
    }

    setIsChatSending(true);

    try {
      const messageRef = push(
        ref(
          db,
          `rooms/${roomCode}/gnosiaChats/${day}/messages`
        )
      );

      await set(messageRef, {
        playerId: myPlayer.id,
        playerName: myPlayer.name,
        text: trimmedText,
        createdAt: Date.now(),
      });
    } finally {
      setIsChatSending(false);
    }
  };

  const selectTarget = async (targetId: string) => {
    setSelectedId(targetId);

    if (myPlayer.role === "gnosia") {
      await onSelectGnosiaAttackTarget(targetId);
    }
  };

  const finishNight = async (
    targetId?: string
  ) => {
    try {
      setErrorMessage("");
      setWaiting(true);

      await onSubmitAction(targetId);
    } catch (error) {
      console.error(error);
      setWaiting(false);
      setErrorMessage(
        "夜行動の保存に失敗しました。もう一度試してください。"
      );
    }
  };

  const submitSelectedTarget = async () => {
    const targetId =
      myPlayer.role === "gnosia"
        ? gnosiaAttackTargetId
        : selectedId;

    if (!targetId) {
      setErrorMessage(
        "対象を選択してください。"
      );
      return;
    }

    await finishNight(targetId);
  };

  const renderTargetGrid = (
    description: string,
    buttonLabel: string
  ) => (
    <div className="border rounded-xl p-6">
      <h3 className="text-xl font-bold mb-3">
        {roleNames[myPlayer.role ?? ""] ?? "夜行動"}
      </h3>

      <p className="mb-5 text-gray-700">
        {description}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {selectableTargets.map((player) => (
          <button
            key={player.id}
            onClick={() =>
              selectTarget(player.id)
            }
            className={`border rounded-xl p-4 text-center transition ${
              displayedSelectedId === player.id
                ? "ring-4 ring-indigo-400"
                : "hover:bg-indigo-50"
            }`}
          >
            <Image
              src={
                player.character
                  ? `/characters/${player.character}.png`
                  : "/characters/question.png"
              }
              alt={player.character ?? "未選択"}
              width={120}
              height={120}
              className="mx-auto rounded-lg"
            />

            <p className="mt-3 font-bold">
              {player.name}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={submitSelectedTarget}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );

  const renderGnosiaChat = () => (
    <div className="mb-8 border rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4">
        グノーシア相談チャット
      </h3>

      <div className="border rounded-lg bg-gray-50 h-64 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-gray-500">
            まだメッセージはありません。
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className="mb-4"
            >
              <p className="font-bold text-red-600">
                {message.playerName}
              </p>

              <p className="ml-3 break-words">
                {message.text}
              </p>
            </div>
          ))
        )}
      </div>

      <ChatInput
        onSend={sendGnosiaMessage}
        disabled={isChatSending || waiting}
      />
    </div>
  );

  const renderGnosiaAbility = () => (
    <div>
      {renderGnosiaChat()}
      {renderTargetGrid(
        "グノーシア全員で共有する襲撃対象を選択してください。",
        "この襲撃対象で夜行動を終了する"
      )}
    </div>
  );

  const renderAbility = () => {
    switch (myPlayer.role) {
      case "engineer":
        return renderTargetGrid(
          "調査するプレイヤーを選択してください。",
          "調査対象を決定する"
        );

      case "doctor":
        return (
          <div className="border rounded-xl p-6">
            <h3 className="text-xl font-bold mb-3">
              ドクター
            </h3>

            {lastEliminatedPlayer ? (
              <>
                <p className="text-gray-700">
                  本日コールドスリープされた
                  {lastEliminatedPlayer.name}
                  を調査します。
                </p>

                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() =>
                      finishNight(
                        lastEliminatedPlayer.id
                      )
                    }
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl"
                  >
                    調査する
                  </button>
                </div>
              </>
            ) : (
              <p className="text-gray-500">
                調査対象を読み込み中です。
              </p>
            )}
          </div>
        );

      case "guardianAngel":
        return renderTargetGrid(
          "守るプレイヤーを選択してください。",
          "守護対象を決定する"
        );

      case "gnosia":
        return renderGnosiaAbility();

      default:
        return (
          <div className="border rounded-xl p-6">
            <h3 className="text-xl font-bold mb-3">
              夜フェーズ
            </h3>

            <p>
              あなたは夜に行動できません。
            </p>

            <p className="text-gray-500 mt-3">
              行動を終了して、夜が明けるまでお待ちください。
            </p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">

      {waiting && (
        <WaitingOverlay
          title="待機中"
          message="他のプレイヤーが夜の行動を終了するまでお待ちください。"
        />
      )}

      <h2 className="text-3xl font-bold text-center mb-8">
        夜フェーズ
      </h2>

      <Timer
        initialSeconds={60}
        onFinish={() =>
          finishNight(
            myPlayer.role === "gnosia"
              ? gnosiaAttackTargetId
              : selectedId
          )
        }
      />

      <div className="border rounded-xl p-6 mt-8">

        <h3 className="text-2xl font-bold mb-2">
          あなたの役職
        </h3>

        <p className="text-xl">
          {roleNames[myPlayer.role ?? ""] ?? myPlayer.role}
        </p>

      </div>

      {errorMessage && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="mt-8">
        {renderAbility()}
      </div>

      <div className="flex justify-center mt-10">

        <button
          onClick={() => finishNight()}
          className="bg-gray-700 hover:bg-gray-800 text-white px-8 py-3 rounded-xl"
        >
          夜の行動を終了する
        </button>

      </div>

    </div>
  );
}
