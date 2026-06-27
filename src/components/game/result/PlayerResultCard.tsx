"use client";

import Image from "next/image";
import type { Player } from "@/types/player";

type PlayerWithId = Player & {
  id: string;
};

type Props = {
  player: PlayerWithId;
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

const roleColors: Record<string, string> = {
  crew: "text-blue-600",
  gnosia: "text-red-600",
  engineer: "text-green-600",
  doctor: "text-purple-600",
  guardianAngel: "text-cyan-600",
  guardDuty: "text-yellow-600",
  acFollower: "text-orange-600",
  bug: "text-pink-600",
};

export default function PlayerResultCard({
  player,
}: Props) {
  return (
    <div className="border rounded-xl shadow-sm p-4 text-center">

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

      <p className="mt-3 text-xl font-bold">
        {player.name}
      </p>

      <p className="text-gray-500">
        {player.character ?? "未選択"}
      </p>

      <p
        className={`mt-3 font-bold ${
          roleColors[player.role ?? ""] ??
          "text-gray-600"
        }`}
      >
        {roleNames[player.role ?? ""] ??
          "？？？"}
      </p>

      <div className="mt-3">
        {player.alive ? (
          <span className="text-green-600 font-semibold">
            ✅ 生存
          </span>
        ) : (
          <span className="text-red-600 font-semibold">
            ❄️ コールドスリープ
          </span>
        )}
      </div>

    </div>
  );
}