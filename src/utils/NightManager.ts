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

type EngineerInvestigationHistory = Record<
  string,
  Record<string, true>
>;

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

  const roomSnap = await get(
    ref(db, `rooms/${roomCode}`)
  );

  const room = roomSnap.val();

  if (!room || room.phase !== "night") {
    return;
  }

  const engineerInvestigationHistory =
    (room.engineerInvestigationHistory ??
      {}) as EngineerInvestigationHistory;

  if (
    player.role === "engineer" &&
    targetId &&
    engineerInvestigationHistory[player.id]?.[targetId]
  ) {
    throw new Error("Already investigated target");
  }

  const actionTargetId =
    player.role === "gnosia"
      ? room.gnosiaAttackTargetId ?? targetId ?? null
      : targetId ?? null;

  await update(
    ref(
      db,
      `rooms/${roomCode}/nightActions/${player.id}`
    ),
    {
      role: player.role ?? "crew",
      targetId: actionTargetId,
      finished: true,
    }
  );

  const players: PlayerWithId[] = Object.entries(
    room.players ?? {}
  ).map(([id, value]) => ({
    id,
    ...(value as Player),
  }));

  const actions: Record<string, NightAction> = {
    ...(room.nightActions ?? {}),
    [player.id]: {
      role: player.role ?? "crew",
      targetId: actionTargetId ?? undefined,
      finished: true,
    },
  };

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
  const roomSnap = await get(
    ref(db, `rooms/${roomCode}`)
  );
  const room = roomSnap.val();
  const sharedGnosiaAttackTargetId =
    room?.gnosiaAttackTargetId ?? null;

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
  const updates: Record<string, unknown> = {};

  //------------------------------------------------
  // 守護対象
  //------------------------------------------------

  let protectedId: string | null = null;

  //------------------------------------------------
  // 襲撃対象
  //------------------------------------------------

  let attackTarget: string | null =
    sharedGnosiaAttackTargetId;
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
        updates[
          `rooms/${roomCode}/engineerInvestigationHistory/${playerId}/${action.targetId}`
        ] = true;

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
        if (!attackTarget && action.targetId) {
          attackTarget = action.targetId;
        }

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
        eliminationReason: "attack",
      }
    );
  }

  const attackedPlayerId =
    attackTarget && !attackPrevented
      ? attackTarget
      : null;

  bugKilledIds.forEach((bugPlayerId) => {
    updates[
      `rooms/${roomCode}/players/${bugPlayerId}/alive`
    ] = false;
    updates[
      `rooms/${roomCode}/players/${bugPlayerId}/eliminationReason`
    ] = "bug";
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

  const currentDay = room?.day ?? 1;
  const logDay = currentDay + 1;
  const time = new Date().toLocaleTimeString(
    "ja-JP",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  if (attackedPlayerId) {
    updates[
      `rooms/${roomCode}/gameLogs/night-${logDay}-attack`
    ] = {
      id: `night-${logDay}-attack`,
      day: logDay,
      time,
      order: 20,
      message: `昨夜、${attackTargetPlayer?.name ?? "不明"} が消滅しました。`,
    };
  }

  if (bugKilledIds.length > 0) {
    const bugKilledNames = players
      .filter((player) =>
        bugKilledIds.includes(player.id)
      )
      .map((player) => player.name)
      .join("、");

    updates[
      `rooms/${roomCode}/gameLogs/night-${logDay}-bug`
    ] = {
      id: `night-${logDay}-bug`,
      day: logDay,
      time,
      order: 21,
      message: `エンジニアの調査により、${bugKilledNames} がバグとして消滅しました。`,
    };
  }

  if (gameEnded) {
    updates[`rooms/${roomCode}/winner`] =
      winResult.winner;
    updates[`rooms/${roomCode}/gameLogs/result-${logDay}`] =
      {
        id: `result-${logDay}`,
        day: logDay,
        time,
        order: 90,
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
      gnosiaAttackTargetId: null,
    }
  );

  //------------------------------------------------
  // 朝へ
  //------------------------------------------------

  await update(
    ref(db, `rooms/${roomCode}`),
    {
      phase: gameEnded ? "result" : "morning",
      day: logDay,
    }
  );
}
