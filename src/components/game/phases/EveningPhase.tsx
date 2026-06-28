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
    <main className="relative min-h-screen overflow-hidden bg-[#d8eff8] px-8 py-8 text-[#2e2c2c]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(220,246,255,0.96)_0%,rgba(189,227,238,0.9)_45%,rgba(235,239,238,0.96)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.8)_0%,transparent_28%),radial-gradient(circle_at_76%_70%,rgba(113,190,199,0.22)_0%,transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_2px,transparent_2px,transparent_7px)]" />

      <div className="relative z-10 mx-auto min-h-[calc(100vh-4rem)] max-w-7xl">

      {waiting && (
        <WaitingOverlay
          title="待機中"
          message="他のプレイヤーの夕方フェーズ終了を待っています。"
        />
      )}

      <div className="mb-8 flex items-start justify-between gap-6">
        <div className="inline-block bg-white/88 px-10 py-4 pr-24 shadow-[0_0_0_4px_rgba(255,255,255,0.86),4px_4px_0_rgba(0,0,0,0.28)] [clip-path:polygon(0_0,100%_0,92%_100%,0_100%)]">
          <h2 className="text-4xl font-light tracking-[0.16em]">
            夕方会議
          </h2>
        </div>

      {/* タイマー */}
      <Timer
        initialSeconds={120}
        onFinish={finishEvening}
      />
      </div>

      <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
        <EveningPair partners={partners} />

        <EveningChat
          roomCode={roomCode}
          chatId={chatId}
          myName={myPlayer.name}
        />
      </div>

      {/* 終了ボタン */}
      <div className="mt-8 flex justify-center">

        <button
          onClick={finishEvening}
          className="relative h-20 w-60 p-1 text-white transition hover:translate-x-[-2px]"
        >
          <span className="absolute inset-0 bg-white/88 shadow-[4px_4px_0_rgba(0,0,0,0.26)] [clip-path:polygon(18%_0,100%_0,100%_72%,82%_100%,0_100%,0_34%)]" />
          <span className="absolute inset-[5px] bg-[#727681]/78 [clip-path:polygon(18%_0,100%_0,100%_72%,82%_100%,0_100%,0_34%)]" />
          <span className="absolute inset-[5px] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.13)_0px,rgba(255,255,255,0.13)_2px,transparent_2px,transparent_8px)] [clip-path:polygon(18%_0,100%_0,100%_72%,82%_100%,0_100%,0_34%)]" />
          <span className="relative z-10 block pt-5 text-2xl font-light tracking-[0.08em]">
            密談を終了
          </span>
        </button>

      </div>

      </div>
    </main>
  );
}
