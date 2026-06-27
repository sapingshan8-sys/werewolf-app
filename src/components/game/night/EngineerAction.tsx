"use client";

import { useState } from "react";
import {
  ref,
  update,
} from "firebase/database";

import { db } from "@/lib/firebase";
import PlayerCard from "../common/PlayerCard";

import type { Player } from "@/types/player";

type PlayerWithId = Player & {
  id: string;
};

type Props = {
  roomCode: string;
  myPlayerId: string;
  players: PlayerWithId[];
};

export default function EngineerAction({
  roomCode,
  myPlayerId,
  players,
}: Props) {
  const [selectedId, setSelectedId] =
    useState("");

  const [finished, setFinished] =
    useState(false);

  const alivePlayers = players.filter(
    (player) =>
      player.alive &&
      player.id !== myPlayerId
  );

  const inspect = async () => {
    if (!selectedId) {
      alert("調査対象を選択してください");
      return;
    }

    try {
      await update(
        ref(
          db,
          `rooms/${roomCode}/nightActions/${myPlayerId}`
        ),
        {
          role: "engineer",
          targetId: selectedId,
          finished: true,
        }
      );

      setFinished(true);

      alert("調査対象を決定しました。");
    } catch (error) {
      console.error(error);
      alert("保存に失敗しました");
    }
  };

  if (finished) {
    return (
      <div className="border rounded-xl p-6">

        <h3 className="text-2xl font-bold mb-3">
          エンジニア
        </h3>

        <p>
          調査対象を決定しました。
        </p>

        <p className="text-gray-500 mt-2">
          夜が明けるまでお待ちください。
        </p>

      </div>
    );
  }

  return (
    <div className="border rounded-xl p-6">

      <h3 className="text-2xl font-bold mb-5">
        エンジニア
      </h3>

      <p className="mb-5">
        調査するプレイヤーを選択してください。
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

        {alivePlayers.map((player) => (

          <button
            key={player.id}
            onClick={() =>
              setSelectedId(player.id)
            }
            className={`rounded-xl transition
              ${
                selectedId === player.id
                  ? "ring-4 ring-blue-500"
                  : ""
              }`}
          >
            <PlayerCard player={player} />
          </button>

        ))}

      </div>

      <div className="mt-8 flex justify-center">

        <button
          onClick={inspect}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl"
        >
          調査する
        </button>

      </div>

    </div>
  );
}