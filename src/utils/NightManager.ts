import {
  get,
  ref,
  update,
} from "firebase/database";

import { db } from "@/lib/firebase";

import type { Player } from "@/types/player";
import { judgeWin } from "./WinCondition";

type PlayerWithId = Player & {
  id: string;
};

type NightAction = {
  role: string;
  targetId?: string;
  finished?: boolean;
};

function getAlivePlayers(players: PlayerWithId[]) {
  return players.filter(
    (player) => player.alive !== false
  );
}

export async function submitNightAction(
  roomCode: string,
  player: PlayerWithId,
  targetId?: string
) {
  if (player.alive === false) {
    return;
  }

  await update(
    ref(
      db,
      `rooms/${roomCode}/nightActions/${player.id}`
    ),
    {
      role: player.role ?? "crew",
      targetId: targetId ?? null,
      finished: true,
    }
  );

  const roomSnap = await get(
    ref(db, `rooms/${roomCode}`)
  );

  const room = roomSnap.val();

  if (!room || room.phase !== "night") {
    return;
  }

  const players: PlayerWithId[] = Object.entries(
    room.players ?? {}
  ).map(([id, value]) => ({
    id,
    ...(value as Player),
  }));

  const actions: Record<string, NightAction> =
    room.nightActions ?? {};

  const allFinished = getAlivePlayers(players).every(
    (alivePlayer) =>
      alivePlayer.id === player.id ||
      actions[alivePlayer.id]?.finished === true
  );

  if (allFinished) {
    await executeNight(roomCode);
  }
}

export async function executeNight(
  roomCode: string
) {
  //------------------------------------------------
  // プレイヤー取得
  //------------------------------------------------

  const playerSnap = await get(
    ref(db, `rooms/${roomCode}/players`)
  );

  if (!playerSnap.exists()) return;

  const players: PlayerWithId[] = Object.entries(
    playerSnap.val()
  ).map(([id, value]) => ({
    id,
    ...(value as Player),
  }));

  //------------------------------------------------
  // 夜行動取得
  //------------------------------------------------

  const actionSnap = await get(
    ref(db, `rooms/${roomCode}/nightActions`)
  );

  const actions: Record<string, NightAction> =
    actionSnap.exists()
      ? actionSnap.val()
      : {};

  //------------------------------------------------
  // エンジニア判定
  //------------------------------------------------

  const engineerResults: Record<
    string,
    {
      targetId: string;
      isGnosia: boolean;
    }
  > = {};
  const bugKilledIds: string[] = [];

  //------------------------------------------------
  // 守護対象
  //------------------------------------------------

  let protectedId: string | null = null;

  //------------------------------------------------
  // 襲撃対象
  //------------------------------------------------

  let attackTarget: string | null = null;
  let doctorTarget: string | null = null;

  for (const playerId in actions) {
    const action = actions[playerId];

    switch (action.role) {
      case "engineer": {
        if (!action.targetId) {
          break;
        }

        const target = players.find(
          (p) => p.id === action.targetId
        );

        engineerResults[playerId] = {
          targetId: action.targetId,
          isGnosia:
            target?.role === "gnosia",
        };

        if (
          target?.role === "bug" &&
          !bugKilledIds.includes(target.id)
        ) {
          bugKilledIds.push(target.id);
        }

        break;
      }

      case "doctor": {
        doctorTarget =
          action.targetId ?? null;

        break;
      }

      case "guardianAngel": {

        protectedId =
          action.targetId ?? null;

        break;
      }

      case "gnosia": {

        attackTarget =
          action.targetId ?? null;

        break;
      }
    }
  }

  //------------------------------------------------
  // 襲撃処理
  //------------------------------------------------

  const attackTargetPlayer = players.find(
    (player) => player.id === attackTarget
  );
  const bugSurvivedAttack =
    attackTargetPlayer?.role === "bug";
  const attackPrevented =
    Boolean(attackTarget) &&
    (attackTarget === protectedId ||
      bugSurvivedAttack);

  if (
    attackTarget &&
    !attackPrevented
  ) {
    await update(
      ref(
        db,
        `rooms/${roomCode}/players/${attackTarget}`
      ),
      {
        alive: false,
      }
    );
  }

  const attackedPlayerId =
    attackTarget && !attackPrevented
      ? attackTarget
      : null;

  const updates: Record<string, unknown> = {};

  bugKilledIds.forEach((bugPlayerId) => {
    updates[
      `rooms/${roomCode}/players/${bugPlayerId}/alive`
    ] = false;
  });

  const playersAfterNight = players.map((player) => ({
    ...player,
    alive:
      player.id === attackedPlayerId ||
      bugKilledIds.includes(player.id)
        ? false
        : player.alive,
  }));
  const winResult = judgeWin(playersAfterNight);
  const gameEnded = winResult.winner !== null;

  //------------------------------------------------
  // 能力結果保存
  //------------------------------------------------

  const doctorResults = doctorTarget
    ? {
        targetId: doctorTarget,
        isHuman:
          players.find((p) => p.id === doctorTarget)
            ?.role !== "gnosia",
      }
    : null;

  updates[`rooms/${roomCode}/engineerResults`] =
    engineerResults;
  updates[`rooms/${roomCode}/doctorResults`] =
    doctorResults;
  updates[`rooms/${roomCode}/protectedSuccess`] =
    attackPrevented;
  updates[`rooms/${roomCode}/attackedPlayerId`] =
    attackedPlayerId;
  updates[`rooms/${roomCode}/bugKilled`] =
    bugKilledIds.length > 0;
  updates[`rooms/${roomCode}/bugKilledIds`] =
    bugKilledIds;

  if (gameEnded) {
    const day = (
      (
        await get(
          ref(
            db,
            `rooms/${roomCode}/day`
          )
        )
      ).val() ?? 1
    ) + 1;
    const time = new Date().toLocaleTimeString(
      "ja-JP",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

    updates[`rooms/${roomCode}/winner`] =
      winResult.winner;
    updates[`rooms/${roomCode}/gameLogs/result-${day}`] =
      {
        id: `result-${day}`,
        day,
        time,
        message: winResult.message,
      };
  }

  await update(ref(db), updates);

  //------------------------------------------------
  // 夜行動リセット
  //------------------------------------------------

  await update(
    ref(db, `rooms/${roomCode}`),
    {
      nightActions: null,
    }
  );

  //------------------------------------------------
  // 朝へ
  //------------------------------------------------

  await update(
    ref(db, `rooms/${roomCode}`),
    {
      phase: gameEnded ? "result" : "morning",
      day:
        (
          (
            await get(
              ref(
                db,
                `rooms/${roomCode}/day`
              )
            )
          ).val() ?? 1
        ) + 1,
    }
  );
}
