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

const actionThemes: Record<
  string,
  {
    title: string;
    label: string;
    background: string;
    titlePanel: string;
    selected: string;
    watermark: string;
  }
> = {
  engineer: {
    title: "誰を調べますか",
    label: "ANALYZE",
    background:
      "bg-[linear-gradient(110deg,#b9d8ee_0%,#d9ecf9_46%,#c2ddf2_100%)]",
    titlePanel: "bg-[#1268a8]/88",
    selected: "shadow-[0_0_0_5px_rgba(19,105,168,0.95)]",
    watermark: "text-[#2e75aa]/12",
  },
  guardianAngel: {
    title: "誰を守りますか",
    label: "PROTECT",
    background:
      "bg-[linear-gradient(110deg,#e8c574_0%,#eff0cb_48%,#e5cf86_100%)]",
    titlePanel: "bg-[#e0a008]/92",
    selected: "shadow-[0_0_0_5px_rgba(18,105,168,0.95)]",
    watermark: "text-[#d69f1b]/16",
  },
  gnosia: {
    title: "獲物ヲ選べ",
    label: "TARGET",
    background:
      "bg-[linear-gradient(110deg,#63302f_0%,#a16d55_48%,#713833_100%)]",
    titlePanel: "bg-[#3b0709]/92",
    selected: "shadow-[0_0_0_5px_rgba(210,0,16,0.95)]",
    watermark: "text-[#b41016]/20",
  },
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
  const currentTheme =
    actionThemes[myPlayer.role ?? ""] ??
    actionThemes.engineer;
  const hasTargetAction =
    myPlayer.role === "engineer" ||
    myPlayer.role === "guardianAngel" ||
    myPlayer.role === "gnosia";

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

  const selectAndSubmitTarget = async (
    targetId: string
  ) => {
    await selectTarget(targetId);
    await finishNight(targetId);
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

  const renderTargetGrid = (
    description: string
  ) => (
    <div className="relative z-10 min-h-0">
      <p className="mb-5 ml-8 max-w-3xl bg-white/72 px-5 py-3 text-lg text-[#3e3b3b] shadow-[0_0_0_3px_rgba(255,255,255,0.72)] [clip-path:polygon(7%_0,100%_0,94%_100%,0_100%,0_28%)]">
        {description}
      </p>

      <div className="grid max-h-[calc(100vh-15rem)] w-[38rem] grid-cols-1 gap-4 overflow-y-auto px-8 pb-4">
        {selectableTargets.map((player) => (
          <button
            key={player.id}
            onClick={() =>
              selectAndSubmitTarget(player.id)
            }
            disabled={waiting}
            className={`group relative h-24 overflow-hidden bg-white/88 text-left transition hover:translate-x-1 [clip-path:polygon(12%_0,100%_0,92%_100%,0_100%,0_36%)] ${
              displayedSelectedId === player.id
                ? currentTheme.selected
                : "shadow-[0_0_0_4px_rgba(255,255,255,0.72)]"
            }`}
          >
            <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden opacity-95">
              <Image
                src={
                  player.character
                    ? `/characters/${player.character}.png`
                    : "/characters/question.png"
                }
                alt={player.character ?? "未選択"}
                fill
                sizes="260px"
                className="object-cover object-center transition group-hover:scale-105"
              />
            </div>

            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.9)_48%,rgba(255,255,255,0.08)_100%)]" />
            <div className="absolute inset-0 border-2 border-white/80 [clip-path:polygon(12%_0,100%_0,92%_100%,0_100%,0_36%)]" />

            <p className="relative z-10 ml-14 mt-6 text-3xl font-light tracking-[0.08em] text-[#3e3b3b]">
              {player.name}
            </p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderGnosiaChat = () => (
    <div className="relative z-20 min-h-0 p-1 text-white">
      <div className="absolute inset-0 bg-white/82 shadow-[4px_4px_0_rgba(0,0,0,0.22)] [clip-path:polygon(7%_0,100%_0,96%_100%,0_100%,0_16%)]" />
      <div className="absolute inset-[5px] bg-[#727681]/82 [clip-path:polygon(7%_0,100%_0,96%_100%,0_100%,0_16%)]" />
      <div className="absolute inset-[5px] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.12)_0px,rgba(255,255,255,0.12)_2px,transparent_2px,transparent_8px)] [clip-path:polygon(7%_0,100%_0,96%_100%,0_100%,0_16%)]" />

      <div className="relative z-10 p-5">
      <h3 className="mb-4 text-xl font-light tracking-[0.14em]">
        グノーシア相談チャット
      </h3>

      <div className="h-44 overflow-y-auto bg-white/70 p-4 text-[#2e2c2c] shadow-[0_0_0_3px_rgba(255,255,255,0.58)] [clip-path:polygon(5%_0,100%_0,98%_100%,0_100%,0_18%)]">
        {messages.length === 0 ? (
          <p className="text-[#666]">
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
    </div>
  );

  const renderGnosiaAbility = () => (
    <div className="grid min-h-0 gap-8 lg:grid-cols-[42rem_1fr]">
      {renderTargetGrid(
        "襲撃対象を選択してください。選択すると夜行動を終了します。"
      )}
      {renderGnosiaChat()}
    </div>
  );

  const renderAbility = () => {
    switch (myPlayer.role) {
      case "engineer":
        return renderTargetGrid(
          "調査するプレイヤーを選択してください。選択すると夜行動を終了します。"
        );

      case "doctor":
        return (
          <div className="mx-auto max-w-3xl">
          <div className="relative p-1 text-white">
            <div className="absolute inset-0 bg-white/88 shadow-[4px_4px_0_rgba(0,0,0,0.22)] [clip-path:polygon(8%_0,100%_0,96%_100%,0_100%,0_18%)]" />
            <div className="absolute inset-[5px] bg-[#727681]/82 [clip-path:polygon(8%_0,100%_0,96%_100%,0_100%,0_18%)]" />
            <div className="absolute inset-[5px] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.12)_0px,rgba(255,255,255,0.12)_2px,transparent_2px,transparent_8px)] [clip-path:polygon(8%_0,100%_0,96%_100%,0_100%,0_18%)]" />

            <div className="relative z-10 p-8">
            <h3 className="mb-4 text-3xl font-light tracking-[0.14em]">
              ドクター
            </h3>

            {lastEliminatedPlayer ? (
              <>
                <p className="text-xl text-white/86">
                  本日コールドスリープされた
                  {lastEliminatedPlayer.name}
                  を脳解析します。
                </p>

                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() =>
                      finishNight(
                        lastEliminatedPlayer.id
                      )
                    }
                    className="bg-white/16 px-8 py-3 text-xl font-semibold text-white shadow-[0_0_0_3px_rgba(255,255,255,0.72)] transition hover:bg-white/28 [clip-path:polygon(10%_0,100%_0,92%_100%,0_100%,0_32%)]"
                  >
                    脳解析する
                  </button>
                </div>
              </>
            ) : (
              <p className="text-white/72">
                調査対象を読み込み中です。
              </p>
            )}
            </div>
          </div>
          </div>
        );

      case "guardianAngel":
        return renderTargetGrid(
          "守るプレイヤーを選択してください。選択すると夜行動を終了します。"
        );

      case "gnosia":
        return renderGnosiaAbility();

      default:
        return (
          <div className="mx-auto max-w-3xl">
          <div className="relative p-1 text-white">
            <div className="absolute inset-0 bg-white/88 shadow-[4px_4px_0_rgba(0,0,0,0.22)] [clip-path:polygon(8%_0,100%_0,96%_100%,0_100%,0_18%)]" />
            <div className="absolute inset-[5px] bg-[#727681]/82 [clip-path:polygon(8%_0,100%_0,96%_100%,0_100%,0_18%)]" />
            <div className="absolute inset-[5px] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.12)_0px,rgba(255,255,255,0.12)_2px,transparent_2px,transparent_8px)] [clip-path:polygon(8%_0,100%_0,96%_100%,0_100%,0_18%)]" />

            <div className="relative z-10 p-8">
            <h3 className="mb-4 text-3xl font-light tracking-[0.14em]">
              夜フェーズ
            </h3>

            <p className="text-xl text-white/88">
              あなたは夜に行動できません。
            </p>

            <p className="mt-3 text-white/72">
              行動を終了して、夜が明けるまでお待ちください。
            </p>
            </div>
          </div>
          </div>
        );
    }
  };

  return (
    <main className={`relative min-h-screen overflow-hidden px-8 py-8 text-[#2e2c2c] ${
      hasTargetAction
        ? currentTheme.background
        : "bg-[linear-gradient(120deg,rgba(220,246,255,0.96)_0%,rgba(189,227,238,0.9)_45%,rgba(235,239,238,0.96)_100%)]"
    }`}>
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.11)_0px,rgba(255,255,255,0.11)_2px,transparent_2px,transparent_7px)]" />
      <div className={`pointer-events-none absolute bottom-[-7rem] right-[-4rem] text-[28rem] font-black leading-none ${hasTargetAction ? currentTheme.watermark : "text-[#2e75aa]/10"}`}>
        {hasTargetAction ? currentTheme.label : "NIGHT"}
      </div>

      {waiting && (
        <WaitingOverlay
          title="待機中"
          message="他のプレイヤーが夜の行動を終了するまでお待ちください。"
        />
      )}

      <div className="relative z-10 min-h-[calc(100vh-4rem)]">
      <div className="mb-7 flex items-start justify-between gap-6">
        <div className={`relative inline-block px-12 py-4 pr-24 text-white shadow-[0_0_0_4px_rgba(255,255,255,0.78),4px_4px_0_rgba(0,0,0,0.24)] [clip-path:polygon(0_0,100%_0,92%_100%,0_100%)] ${hasTargetAction ? currentTheme.titlePanel : "bg-white/40"}`}>
          <h2 className="text-5xl font-light tracking-[0.1em]">
            {hasTargetAction ? currentTheme.title : "夜フェーズ"}
          </h2>
          {hasTargetAction && (
            <span className="absolute right-8 top-0 text-5xl font-semibold italic text-white/22 [font-family:Georgia,Times_New_Roman,serif]">
              {currentTheme.label}
            </span>
          )}
        </div>

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
      </div>

      {errorMessage && (
        <div className="relative z-20 mb-5 ml-24 inline-block bg-red-50/92 px-5 py-3 font-semibold text-red-700 shadow-[0_0_0_3px_rgba(255,255,255,0.78)] [clip-path:polygon(8%_0,100%_0,94%_100%,0_100%,0_30%)]">
          {errorMessage}
        </div>
      )}

      <div className="relative z-10">
        {renderAbility()}
      </div>

      {!hasTargetAction && (
      <div className="mt-10 flex justify-center">

        <button
          onClick={() => finishNight()}
          className="relative h-20 w-64 p-1 text-white transition hover:translate-x-[-2px]"
        >
          <span className="absolute inset-0 bg-white/88 shadow-[4px_4px_0_rgba(0,0,0,0.22)] [clip-path:polygon(18%_0,100%_0,100%_72%,82%_100%,0_100%,0_34%)]" />
          <span className="absolute inset-[5px] bg-[#727681]/78 [clip-path:polygon(18%_0,100%_0,100%_72%,82%_100%,0_100%,0_34%)]" />
          <span className="absolute inset-[5px] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.13)_0px,rgba(255,255,255,0.13)_2px,transparent_2px,transparent_8px)] [clip-path:polygon(18%_0,100%_0,100%_72%,82%_100%,0_100%,0_34%)]" />
          <span className="relative z-10 block pt-5 text-2xl font-light tracking-[0.08em]">
            行動を終了
          </span>
        </button>

      </div>
      )}
      </div>

    </main>
  );
}
