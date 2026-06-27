"use client";

import { useState } from "react";

import Timer from "../common/Timer";
import WaitingOverlay from "../evening/WaitingOverlay";

import type { Player } from "@/types/player";

type PlayerWithId = Player & {
  id: string;
};

type Props = {
  myPlayer: PlayerWithId;
  onFinish?: () => void;
};

export default function NightPhase({
  myPlayer,
  onFinish,
}: Props) {
  const [waiting, setWaiting] =
    useState(false);

  const finishNight = () => {
    setWaiting(true);

    onFinish?.();
  };

  const renderAbility = () => {
    switch (myPlayer.role) {
      case "engineer":
        return (
          <div className="border rounded-xl p-6">
            <h3 className="text-xl font-bold mb-3">
              エンジニア
            </h3>

            <p>
              調査するプレイヤーを選択します。
            </p>

            <p className="text-gray-500 mt-3">
              （次のステップで実装）
            </p>
          </div>
        );

      case "doctor":
        return (
          <div className="border rounded-xl p-6">
            <h3 className="text-xl font-bold mb-3">
              ドクター
            </h3>

            <p>
              コールドスリープされたプレイヤーを調査します。
            </p>

            <p className="text-gray-500 mt-3">
              （次のステップで実装）
            </p>
          </div>
        );

      case "guardian":
        return (
          <div className="border rounded-xl p-6">
            <h3 className="text-xl font-bold mb-3">
              守護天使
            </h3>

            <p>
              守るプレイヤーを選択します。
            </p>

            <p className="text-gray-500 mt-3">
              （次のステップで実装）
            </p>
          </div>
        );

      case "gnosia":
        return (
          <div className="border rounded-xl p-6">
            <h3 className="text-xl font-bold mb-3">
              グノーシア
            </h3>

            <p>
              襲撃するプレイヤーを選択します。
            </p>

            <p className="text-gray-500 mt-3">
              （次のステップで実装）
            </p>
          </div>
        );

      case "crew":
      case "guardDuty":
      case "acFollower":
      case "bug":
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
              夜が明けるまでお待ちください。
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
          message="他のプレイヤーが夜の能力を実行しています。"
        />
      )}

      <h2 className="text-3xl font-bold text-center mb-8">
        🌙 夜フェーズ
      </h2>

      <Timer
        initialSeconds={60}
        onFinish={finishNight}
      />

      <div className="border rounded-xl p-6 mt-8">

        <h3 className="text-2xl font-bold mb-2">
          あなたの役職
        </h3>

        <p className="text-xl">
          {myPlayer.role}
        </p>

      </div>

      <div className="mt-8">
        {renderAbility()}
      </div>

      <div className="flex justify-center mt-10">

        <button
          onClick={finishNight}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl"
        >
          夜の行動を終了する
        </button>

      </div>

    </div>
  );
}