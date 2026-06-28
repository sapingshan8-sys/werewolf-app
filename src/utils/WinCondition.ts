import type { Player } from "@/types/player";

type PlayerWithId = Player & {
  id: string;
};

type WinResult = {
  winner: "crew" | "gnosia" | null;
  message: string;
};

export function judgeWin(
  players: PlayerWithId[]
): WinResult {
  const alivePlayers = players.filter(
    (player) => player.alive !== false
  );
  const aliveGnosiaCount = alivePlayers.filter(
    (player) => player.role === "gnosia"
  ).length;
  const aliveCrewCount = alivePlayers.filter(
    (player) =>
      player.role !== "gnosia" &&
      player.role !== "bug"
  ).length;

  if (aliveGnosiaCount === 0) {
    return {
      winner: "crew",
      message:
        "グノーシアが全員コールドスリープしたため、乗員陣営の勝利です。",
    };
  }

  if (aliveCrewCount <= aliveGnosiaCount) {
    return {
      winner: "gnosia",
      message:
        "生存している乗員の人数がグノーシア以下になったため、グノーシア陣営の勝利です。",
    };
  }

  return {
    winner: null,
    message: "",
  };
}
