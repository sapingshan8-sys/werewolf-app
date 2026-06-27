"use client";

import Image from "next/image";
import type { Player } from "@/types/player";

type PlayerWithId = Player & {
  id: string;
};

type Props = {
  players: PlayerWithId[];
  myPlayerId: string;
  currentVoteTargetId?: string;
  errorMessage?: string;
  isSubmitting: boolean;
  submittedCount: number;
  votePlayer: (targetId: string) => Promise<void>;
};

export default function VotePhase({
  players,
  myPlayerId,
  currentVoteTargetId,
  errorMessage,
  isSubmitting,
  submittedCount,
  votePlayer,
}: Props) {
  const alivePlayers = players.filter(
    (player) => player.alive !== false
  );
  const votedTarget = players.find(
    (player) => player.id === currentVoteTargetId
  );

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
          投票
        </p>

        <p className="mt-2 text-gray-700">
          生存者を1人選択してください。
          自分には投票できません。
        </p>

        <p className="mt-3 text-sm text-gray-600">
          投票済み: {submittedCount} / {alivePlayers.length}
        </p>

        {votedTarget && (
          <p className="mt-3 font-semibold text-red-700">
            あなたは {votedTarget.name} に投票しました。
            全員の投票を待っています。
          </p>
        )}

        {errorMessage && (
          <p className="mt-3 font-semibold text-red-700">
            {errorMessage}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">

        {alivePlayers.map((player) => {

            const isMe =
              player.id === myPlayerId;
            const voted =
              player.id === currentVoteTargetId;
            const disabled =
              isMe ||
              isSubmitting ||
              Boolean(currentVoteTargetId);

            return (

              <button
                key={player.id}
                disabled={disabled}
                onClick={() =>
                  votePlayer(player.id)
                }
                className={`border rounded-xl p-4 transition
                  ${
                    disabled
                      ? "bg-gray-200 cursor-not-allowed"
                      : "hover:bg-red-100"
                  }
                  ${voted ? "ring-4 ring-red-300" : ""}
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

                {voted && (
                  <p className="mt-2 text-sm font-semibold text-red-700">
                    投票済み
                  </p>
                )}

              </button>

            );
          })}

      </div>

    </div>
  );
}
