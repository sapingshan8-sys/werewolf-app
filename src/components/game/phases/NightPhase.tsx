"use client";

import Image from "next/image";
import { useState } from "react";

import Timer from "../common/Timer";
import WaitingOverlay from "../evening/WaitingOverlay";

import type { Player } from "@/types/player";

type PlayerWithId = Player & {
  id: string;
};

type Props = {
  myPlayer: PlayerWithId;
  players: PlayerWithId[];
  lastEliminatedPlayer?: PlayerWithId;
  alreadyFinished?: boolean;
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
  myPlayer,
  players,
  lastEliminatedPlayer,
  alreadyFinished = false,
  onSubmitAction,
}: Props) {
  const [selectedId, setSelectedId] =
    useState("");
  const [waiting, setWaiting] =
    useState(alreadyFinished);
  const [errorMessage, setErrorMessage] =
    useState("");

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
    if (!selectedId) {
      setErrorMessage(
        "対象を選択してください。"
      );
      return;
    }

    await finishNight(selectedId);
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
              setSelectedId(player.id)
            }
            className={`border rounded-xl p-4 text-center transition ${
              selectedId === player.id
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
        return renderTargetGrid(
          "襲撃するプレイヤーを選択してください。",
          "襲撃対象を決定する"
        );

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
        onFinish={() => finishNight(selectedId)}
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
