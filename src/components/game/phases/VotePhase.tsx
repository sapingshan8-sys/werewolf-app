"use client";

import Image from "next/image";
import type { Player } from "@/types/player";

type PlayerWithId = Player & {
  id: string;
};

type Props = {
  players: PlayerWithId[];
  myPlayerId: string;
  votePlayer: (targetId: string) => void;
};

export default function VotePhase({
  players,
  myPlayerId,
  votePlayer,
}: Props) {
  return (
    <div>

      <h2 className="text-3xl font-bold mb-4">
        投票フェーズ
      </h2>

      <p className="mb-6 text-gray-700">
        コールドスリープする人物を選んでください。
      </p>

      <div className="mb-8 rounded-xl border bg-red-50 p-4">
        <p className="font-semibold">
          🗳 投票
        </p>

        <p className="mt-2 text-gray-700">
          生存者を1人選択してください。
          自分には投票できません。
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">

        {players
          .filter((player) => player.alive)
          .map((player) => {

            const isMe =
              player.id === myPlayerId;

            return (

              <button
                key={player.id}
                disabled={isMe}
                onClick={() =>
                  votePlayer(player.id)
                }
                className={`border rounded-xl p-4 transition
                  ${
                    isMe
                      ? "bg-gray-200 cursor-not-allowed"
                      : "hover:bg-red-100"
                  }
                `}
              >

                <Image
                  src={`/characters/${player.character}.png`}
                  alt={player.character ?? ""}
                  width={120}
                  height={120}
                  className="mx-auto rounded-lg"
                />

                <p className="mt-3 font-bold">
                  {player.name}
                </p>

                {isMe && (
                  <p className="mt-2 text-sm text-gray-500">
                    あなた
                  </p>
                )}

              </button>

            );
          })}

      </div>

    </div>
  );
}