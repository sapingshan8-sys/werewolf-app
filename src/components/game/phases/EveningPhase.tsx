"use client";

import { useState } from "react";

import Timer from "../common/Timer";

import EveningPair from "../evening/EveningPair";
import EveningChat from "../evening/EveningChat";
import WaitingOverlay from "../evening/WaitingOverlay";

import type { Player } from "@/types/player";

type PlayerWithId = Player & {
  id: string;
};

type Props = {
  roomCode: string;

  myPlayer: PlayerWithId;

  partners: PlayerWithId[];

  chatId: string;

  onTimerFinish?: () => void;
};

export default function EveningPhase({
  roomCode,
  myPlayer,
  partners,
  chatId,
  onTimerFinish,
}: Props) {
  const [waiting, setWaiting] =
    useState(false);

  const finishEvening = () => {
    setWaiting(true);

    if (onTimerFinish) {
      onTimerFinish();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">

      {waiting && (
        <WaitingOverlay
          title="待機中"
          message="他のプレイヤーの夕方フェーズ終了を待っています。"
        />
      )}

      <h2 className="text-3xl font-bold text-center mb-8">
        🌆 夕方フェーズ
      </h2>

      {/* タイマー */}
      <Timer
        initialSeconds={120}
        onFinish={finishEvening}
      />

      {/* 密談相手 */}
      <div className="mt-8">

        <EveningPair
          partners={partners}
        />

      </div>

      {/* 密談チャット */}
      <div className="mt-8">

        <EveningChat
          roomCode={roomCode}
          chatId={chatId}
          myName={myPlayer.name}
        />

      </div>

      {/* 終了ボタン */}
      <div className="flex justify-center mt-10">

        <button
          onClick={finishEvening}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-lg"
        >
          密談を終了する
        </button>

      </div>

    </div>
  );
}
