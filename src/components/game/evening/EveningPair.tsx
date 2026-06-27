"use client";

import PlayerCard from "../common/PlayerCard";
import type { Player } from "@/types/player";

type PlayerWithId = Player & {
  id: string;
};

type Props = {
  partners: PlayerWithId[];
};

export default function EveningPair({
  partners,
}: Props) {
  return (
    <div className="border rounded-xl p-6">

      <h3 className="text-2xl font-bold mb-4">
        密談相手
      </h3>

      {partners.length === 0 ? (
        <p className="text-gray-500">
          密談相手はまだ決まっていません。
        </p>
      ) : (
        <>
          <p className="mb-5 text-gray-600">
            このプレイヤーとだけ会話できます。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {partners.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
              />
            ))}

          </div>
        </>
      )}

    </div>
  );
}