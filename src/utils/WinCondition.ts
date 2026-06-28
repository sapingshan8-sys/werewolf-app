import type { Player } from "@/types/player";

type PlayerWithId = Player & {
  id: string;
};

type WinResult = {
  winner: "crew" | "gnosia" | "bug" | null;
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
  const bugIsAlive = alivePlayers.some(
    (player) => player.role === "bug"
  );
  const aliveCrewCount = alivePlayers.filter(
    (player) =>
      player.role !== "gnosia" &&
      player.role !== "bug"
  ).length;

  if (aliveGnosiaCount === 0) {
    if (bugIsAlive) {
      return {
        winner: "bug",
        message:
          "乗員陣営の勝利条件が満たされましたが、バグが生存していたため、バグの勝利です。",
      };
    }

    return {
      winner: "crew",
      message:
        "グノーシアが全員コールドスリープしたため、乗員陣営の勝利です。",
    };
  }

  if (aliveCrewCount <= aliveGnosiaCount) {
    if (bugIsAlive) {
      return {
        winner: "bug",
        message:
          "グノーシア陣営の勝利条件が満たされましたが、バグが生存していたため、バグの勝利です。",
      };
    }

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
