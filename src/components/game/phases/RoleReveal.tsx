"use client";

import Image from "next/image";
import type { Player } from "@/types/player";

type Props = {
  player: Player;
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

export default function RoleReveal({
  player,
}: Props) {
  return (
    <div className="border rounded-xl p-8 text-center">

      <h2 className="text-3xl font-bold mb-8">
        あなたの役職
      </h2>

      <Image
        src={`/characters/${player.character}.png`}
        alt={player.character ?? ""}
        width={220}
        height={220}
        className="mx-auto rounded-xl"
      />

      <p className="text-2xl font-bold mt-6">
        {player.name}
      </p>

      <p className="text-4xl font-bold text-blue-600 mt-6">
        {roleNames[player.role ?? ""] ?? "？？？"}
      </p>

      <div className="mt-10 p-5 rounded-xl bg-gray-100">

        <p className="font-semibold mb-3">
          役職説明
        </p>

        <p className="text-gray-700">

          {player.role === "crew" &&
            "特殊能力はありません。グノーシアを見つけましょう。"}

          {player.role === "gnosia" &&
            "毎晩、仲間と相談して1人を襲撃できます。"}

          {player.role === "engineer" &&
            "毎晩1人を調査し、グノーシアかどうか判定できます。"}

          {player.role === "doctor" &&
            "コールドスリープされた人物が人間かグノーシアか判定できます。"}

          {player.role === "guardianAngel" &&
            "毎晩1人を護衛できます。"}

          {player.role === "guardDuty" &&
            "ゲーム開始時から人間であることが証明されています。"}

          {player.role === "acFollower" &&
            "人間ですが、グノーシア陣営の勝利を目指します。"}

          {player.role === "bug" &&
            "誰にも属さない第三勢力です。最後まで生き残ることを目指します。"}
        </p>

      </div>

    </div>
  );
}