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
  canRestart?: boolean;
  onRestart?: () => Promise<void> | void;
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

const winnerPanelStyles: Record<
  string,
  {
    panel: string;
    label: string;
    title: string;
  }
> = {
  crew: {
    panel:
      "border-white/45 bg-[#d8eff8]/38 shadow-[0_0_0_3px_rgba(255,255,255,0.26),0_22px_48px_rgba(35,86,104,0.2)]",
    label: "text-[#6f5d4c]",
    title:
      "text-[#174b84] drop-shadow-[0_0_7px_rgba(255,255,255,0.88)]",
  },
  gnosia: {
    panel:
      "border-red-200/55 bg-[#8f242a]/88 shadow-[0_0_0_3px_rgba(255,210,210,0.22),0_22px_48px_rgba(80,12,18,0.34)]",
    label: "text-red-100/82",
    title:
      "text-white drop-shadow-[0_0_8px_rgba(255,180,180,0.42)]",
  },
  bug: {
    panel:
      "border-white/28 bg-black/82 shadow-[0_0_0_3px_rgba(255,255,255,0.14),0_22px_48px_rgba(0,0,0,0.42)]",
    label: "text-white/66",
    title:
      "text-white drop-shadow-[0_0_9px_rgba(170,220,255,0.36)]",
  },
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
  canRestart = false,
  onRestart,
}: Props) {
  const winnerStyle =
    winnerPanelStyles[winner] ??
    winnerPanelStyles.crew;
  const winnerText =
    winnerNames[winner] !== undefined
      ? `${winnerNames[winner]}の勝利です`
      : "勝利陣営は未決定です";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#9fcbd3] px-6 py-10 text-[#2e2c2c]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(210,238,244,0.72)_0%,rgba(156,203,212,0.84)_40%,rgba(91,158,172,0.9)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(40,105,126,0.24)_0%,rgba(226,245,249,0.24)_34%,rgba(229,246,249,0.22)_66%,rgba(43,107,126,0.28)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-[linear-gradient(180deg,rgba(238,250,252,0.46)_0%,rgba(238,250,252,0.12)_58%,rgba(238,250,252,0)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_4%,rgba(236,251,254,0.52)_0%,transparent_24%),radial-gradient(circle_at_88%_82%,rgba(17,94,122,0.2)_0%,transparent_32%)]" />

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

        <section
          className={`mb-10 border p-8 text-center backdrop-blur ${winnerStyle.panel}`}
        >
          <p
            className={`text-lg tracking-[0.24em] ${winnerStyle.label}`}
          >
            勝利陣営
          </p>

          <p
            className={`mt-3 text-5xl font-light tracking-[0.12em] ${winnerStyle.title}`}
          >
            {winnerText}
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
                className="border border-white/45 bg-[#d8eff8]/36 p-4 text-center shadow-[0_8px_24px_rgba(35,86,104,0.18)] backdrop-blur"
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
          {canRestart && onRestart ? (
            <button
              onClick={onRestart}
              className="group px-8 py-2 text-[#6f5d4c] transition hover:text-[#264d72]"
            >
              <span className="block text-sm tracking-[0.28em] text-white/90 drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]">
                SAME ROOM
              </span>

              <span className="block text-3xl font-light tracking-[0.14em] [font-family:Arial_Narrow,Arial,sans-serif]">
                RESTART
              </span>

              <span className="mt-1 block h-px scale-x-0 bg-white/80 transition group-hover:scale-x-100" />
            </button>
          ) : (
            <p className="text-sm tracking-[0.16em] text-[#2f6d90]">
              ホストが再スタートすると、ルーム待機画面に戻ります。
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
