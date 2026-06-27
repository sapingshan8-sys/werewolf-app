"use client";

import PlayerGrid from "../common/PlayerGrid";
import type { Player } from "@/types/player";

type PlayerWithId = Player & {
  id: string;
};

type Props = {
  players: PlayerWithId[];
};

export default function DiscussionPhase({
  players,
}: Props) {
  return (
    <div>

      <h2 className="text-3xl font-bold mb-4">
        議論フェーズ
      </h2>

      <p className="mb-6 text-gray-700">
        怪しい人物について話し合いましょう。
      </p>

      <div className="mb-8 rounded-xl border bg-yellow-50 p-4">
        <p className="font-semibold">
          💬 議論の時間です
        </p>

        <p className="mt-2 text-gray-700">
          このフェーズでは誰がグノーシアなのかを話し合います。
          （チャット機能は後ほど実装予定です。）
        </p>
      </div>

      <PlayerGrid players={players} />

    </div>
  );
}