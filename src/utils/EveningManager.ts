import {
  ref,
  get,
  update,
} from "firebase/database";

import { db } from "@/lib/firebase";

import {
  generatePairs,
  VoteResult,
} from "./PairGenerator";

type EveningPlayerStatus = {
  alive?: boolean;
  eveningFinished?: boolean;
};

export async function createEveningGroups(
  roomCode: string,
  voteResults: VoteResult[]
) {
  const groups = generatePairs(voteResults);

  const updates: Record<string, unknown> = {};

  groups.forEach((group, index) => {
    const chatId = `pair${index + 1}`;

    // グループ情報
    updates[
      `rooms/${roomCode}/eveningChats/${chatId}/members`
    ] = group;

    // 各プレイヤーにchatIdを保存
    group.forEach((playerId) => {
      updates[
        `rooms/${roomCode}/players/${playerId}/chatId`
      ] = chatId;

      updates[
        `rooms/${roomCode}/players/${playerId}/eveningFinished`
      ] = false;
    });
  });

  await update(ref(db), updates);

  return groups;
}

export async function finishEvening(
  roomCode: string,
  playerId: string
) {
  await update(
    ref(
      db,
      `rooms/${roomCode}/players/${playerId}`
    ),
    {
      eveningFinished: true,
    }
  );
}

export async function isEveryoneFinished(
  roomCode: string
) {
  const snapshot = await get(
    ref(db, `rooms/${roomCode}/players`)
  );

  if (!snapshot.exists()) {
    return false;
  }

  const players = snapshot.val() as Record<
    string,
    EveningPlayerStatus
  >;

  return Object.values(players).every(
    (player) =>
      player.alive === false ||
      player.eveningFinished === true
  );
}

export async function startNight(
  roomCode: string
) {
  await update(
    ref(db, `rooms/${roomCode}`),
    {
      phase: "night",
      nightActions: null,
      gnosiaAttackTargetId: null,
    }
  );
}

export async function finishEveningIfReady(
  roomCode: string,
  playerId: string
) {
  await finishEvening(roomCode, playerId);

  const finished =
    await isEveryoneFinished(roomCode);

  if (finished) {
    await startNight(roomCode);
  }
}
