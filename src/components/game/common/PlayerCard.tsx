"use client";

import Image from "next/image";
import type { Player } from "@/types/player";

type PlayerWithId = Player & {
  id: string;
};

type Props = {
  player: PlayerWithId;

  // カードをクリックしたとき
  onClick?: () => void;

  // ボタンとして使うか
  clickable?: boolean;

  // 選択不可
  disabled?: boolean;

  // 選択中表示
  selected?: boolean;

  // 生存者だけ表示する場合など
  showAlive?: boolean;
};

export default function PlayerCard({
  player,
  onClick,
  clickable = false,
  disabled = false,
  selected = false,
  showAlive = true,
}: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        border rounded-xl p-4 w-full
        flex flex-col items-center
        transition

        ${
          clickable
            ? "hover:scale-105 hover:shadow-lg"
            : ""
        }

        ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : ""
        }

        ${
          selected
            ? "ring-4 ring-blue-500"
            : ""
        }
      `}
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
        className="rounded-lg"
      />

      <p className="mt-3 text-lg font-bold">
        {player.name}
      </p>

      <p className="text-gray-500">
        {player.character ?? "未選択"}
      </p>

      {showAlive && (
        <p
          className={`mt-2 font-semibold ${
            player.alive
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {player.alive ? "生存" : "退場"}
        </p>
      )}

      {player.ready && (
        <p className="text-sm text-blue-600 mt-1">
          準備完了
        </p>
      )}
    </button>
  );
}