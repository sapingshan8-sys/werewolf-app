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
    <div className="max-w-6xl mx-auto">

      <h2 className="text-4xl font-bold text-center mb-8">
        ゲーム終了
      </h2>

      <div className="bg-yellow-100 border rounded-xl p-6 text-center mb-10">

        <p className="text-xl">
          勝利陣営
        </p>

        <p className="text-4xl font-bold text-red-600 mt-3">
          {winnerNames[winner] ?? "未決定"}
        </p>

      </div>

      <h3 className="text-2xl font-bold mb-5">
        プレイヤー一覧
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">

        {players.map((player) => (

          <div
            key={player.id}
            className="border rounded-xl p-4 text-center"
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
              className="mx-auto rounded-lg"
            />

            <p className="mt-3 text-lg font-bold">
              {player.name}
            </p>

            <p className="text-blue-600 font-semibold">
              {roleNames[player.role ?? ""] ?? "？？？"}
            </p>

            <p
              className={`mt-2 font-semibold ${
                player.alive
                  ? "text-green-600"
                  : "text-red-600"
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

      <GameLog logs={logs} />

      <VoteHistory history={voteHistory} />

      <div className="mt-12 text-center">

        <button
          onClick={() => location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg"
        >
          もう一度表示する
        </button>

      </div>

    </div>
  );
}
