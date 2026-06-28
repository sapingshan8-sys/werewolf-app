"use client";

import Image from "next/image";
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
    <section className="relative min-h-[28rem] p-1 text-white">
      <div className="absolute inset-0 bg-white/88 shadow-[4px_4px_0_rgba(0,0,0,0.22)] [clip-path:polygon(10%_0,100%_0,96%_100%,0_100%,0_18%)]" />
      <div className="absolute inset-[5px] bg-[#727681]/78 [clip-path:polygon(10%_0,100%_0,96%_100%,0_100%,0_18%)]" />
      <div className="absolute inset-[5px] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.12)_0px,rgba(255,255,255,0.12)_2px,transparent_2px,transparent_8px)] [clip-path:polygon(10%_0,100%_0,96%_100%,0_100%,0_18%)]" />

      <div className="relative z-10 p-6">
      <h3 className="mb-4 text-3xl font-light tracking-[0.14em]">
        密談相手
      </h3>

      {partners.length === 0 ? (
        <p className="text-white/82">
          密談相手はまだ決まっていません。
        </p>
      ) : (
        <>
          <p className="mb-5 text-white/78">
            このプレイヤーとだけ会話できます。
          </p>

          <div className="grid grid-cols-1 gap-4">

            {partners.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-4 bg-white/72 p-3 text-[#2e2c2c] shadow-[0_0_0_3px_rgba(255,255,255,0.72)] [clip-path:polygon(8%_0,100%_0,94%_100%,0_100%,0_30%)]"
              >
                <Image
                  src={
                    player.character
                      ? `/characters/${player.character}.png`
                      : "/characters/question.png"
                  }
                  alt={player.character ?? "未選択"}
                  width={84}
                  height={84}
                  className="aspect-square object-cover"
                />

                <div>
                  <p className="text-2xl font-light tracking-[0.08em]">
                    {player.name}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-green-700">
                    密談中
                  </p>
                </div>
              </div>
            ))}

          </div>
        </>
      )}

      </div>
    </section>
  );
}
