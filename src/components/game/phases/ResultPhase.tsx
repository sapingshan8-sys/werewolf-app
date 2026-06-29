"use client";

import Image from "next/image";
import type { Player } from "@/types/player";
import GameLog from "../result/GameLog";
import VoteHistory from "../result/VoteHistory";

type PlayerWithId = Player & {
  id: string;
};

type Props = {
  players: PlayerWithId[];
  winner: string;
  logs: {
    id: string;
    day: number;
    time: string;
    message: string;
  }[];
  voteHistory: {
    day: number;
    order?: number;
    votes: {
      voterName: string;
      targetName: string;
    }[];
  }[];
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

const winnerNames: Record<string, string> = {
  crew: "乗員陣営",
  gnosia: "グノーシア陣営",
  bug: "バグ",
};

const eliminationLabels: Record<string, string> = {
  coldSleep: "コールドスリープ",
  attack: "消滅",
  bug: "バグ消滅",
};

export default function ResultPhase({
  players,
  winner,
  logs,
  voteHistory,
}: Props) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#c8e2e6] px-6 py-10 text-[#2e2c2c]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(204,228,231,0.68)_34%,rgba(132,190,199,0.72)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(70,132,150,0.18)_0%,rgba(255,255,255,0.45)_32%,rgba(255,255,255,0.5)_68%,rgba(73,137,150,0.22)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.2)_58%,rgba(255,255,255,0)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_4%,rgba(255,255,255,0.9)_0%,transparent_26%),radial-gradient(circle_at_88%_82%,rgba(41,126,153,0.16)_0%,transparent_32%)]" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <section className="mb-12 text-center">
          <div className="relative mx-auto mb-8 max-w-4xl">
            <div className="absolute left-0 right-0 top-1/2 h-px bg-[#1e5b8e]/62" />

            <h2 className="relative text-[clamp(3.5rem,10vw,8rem)] font-normal italic tracking-[0.18em] text-[#174b84] drop-shadow-[0_0_8px_rgba(255,255,255,0.75)] [font-family:Georgia,Times_New_Roman,serif]">
              GNOSIA
            </h2>
          </div>

          <p className="text-base tracking-[0.32em] text-white/90 drop-shadow-[0_0_7px_rgba(35,95,125,0.34)]">
            GAME RESULT
          </p>
        </section>

        <section className="mb-10 border border-white/70 bg-white/58 p-8 text-center shadow-[0_0_0_3px_rgba(255,255,255,0.48),0_22px_48px_rgba(65,113,128,0.18)] backdrop-blur">
          <p className="text-lg tracking-[0.24em] text-[#6f5d4c]">
            勝利陣営
          </p>

          <p className="mt-3 text-5xl font-light tracking-[0.12em] text-[#174b84] drop-shadow-[0_0_7px_rgba(255,255,255,0.88)]">
            {winnerNames[winner] ?? "未決定"}
          </p>
        </section>

        <section className="mb-10">
          <h3 className="mb-5 border-b border-white/70 pb-3 text-2xl font-light tracking-[0.18em] text-[#174b84]">
            プレイヤー一覧
          </h3>

          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {players.map((player) => (
              <div
                key={player.id}
                className="border border-white/70 bg-white/62 p-4 text-center shadow-[0_8px_24px_rgba(65,113,128,0.16)] backdrop-blur"
              >
                <Image
                  src={
                    player.character
                      ? `/characters/${player.character}.png`
                      : "/characters/question.png"
                  }
                  alt={player.character ?? ""}
                  width={120}
                  height={120}
                  className="mx-auto aspect-square object-cover shadow-[0_0_0_3px_rgba(255,255,255,0.76)]"
                />

                <p className="mt-4 text-lg font-bold">
                  {player.name}
                </p>

                <p className="font-semibold text-[#246c9b]">
                  {roleNames[player.role ?? ""] ?? "？？？"}
                </p>

                <p
                  className={`mt-2 font-semibold ${
                    player.alive
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {player.alive
                    ? "生存"
                    : eliminationLabels[
                        player.eliminationReason ?? ""
                      ] ?? "退場"}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-8">
          <GameLog logs={logs} />

          <VoteHistory history={voteHistory} />
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => location.reload()}
            className="group px-8 py-2 text-[#6f5d4c] transition hover:text-[#264d72]"
          >
            <span className="block text-sm tracking-[0.28em] text-white/90 drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]">
              RESULT
            </span>

            <span className="block text-3xl font-light tracking-[0.14em] [font-family:Arial_Narrow,Arial,sans-serif]">
              RELOAD
            </span>

            <span className="mt-1 block h-px scale-x-0 bg-white/80 transition group-hover:scale-x-100" />
          </button>
        </div>
      </div>
    </main>
  );
}
