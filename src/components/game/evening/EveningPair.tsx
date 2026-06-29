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
    <section className="relative min-h-[28rem] overflow-hidden border border-white/70 bg-white/58 text-[#2e2c2c] shadow-[0_0_0_3px_rgba(255,255,255,0.55),0_18px_40px_rgba(69,117,132,0.18)] backdrop-blur">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(199,232,240,0.26)_55%,rgba(255,255,255,0.42)),radial-gradient(circle_at_85%_10%,rgba(76,165,180,0.16),transparent_34%),repeating-linear-gradient(0deg,rgba(113,158,170,0.08)_0px,rgba(113,158,170,0.08)_1px,transparent_1px,transparent_8px)]" />

      <div className="relative z-10 p-6">
      <h3 className="mb-4 border-b border-[#7aa8b8]/35 pb-3 text-3xl font-light tracking-[0.14em] text-[#2f6d90]">
        密談相手
      </h3>

      {partners.length === 0 ? (
        <p className="text-[#5f747b]">
          密談相手はまだ決まっていません。
        </p>
      ) : (
        <>
          <p className="mb-5 text-[#5f747b]">
            このプレイヤーとだけ会話できます。
          </p>

          <div className="grid grid-cols-1 gap-4">

            {partners.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-4 border border-white/70 bg-white/68 p-3 text-[#2e2c2c] shadow-[0_8px_20px_rgba(75,124,138,0.14)]"
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
