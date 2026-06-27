"use client";

import Image from "next/image";
import type { Player } from "@/types/player";

type PlayerWithId = Player & {
  id: string;
};

type Props = {
  players: PlayerWithId[];
};

export default function PlayerGrid({
  players,
}: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {players
        .filter((player) => player.alive)
        .map((player) => (
          <div
            key={player.id}
            className="border rounded-xl p-4 text-center"
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

            <p className="text-green-600">
              生存
            </p>
          </div>
        ))}
    </div>
  );
}