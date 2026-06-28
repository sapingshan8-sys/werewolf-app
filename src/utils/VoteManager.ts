import {
  get,
  ref,
  update,
} from "firebase/database";

import { db } from "@/lib/firebase";
import type { Player } from "@/types/player";

import { createEveningGroups } from "./EveningManager";
import type { VoteResult } from "./PairGenerator";
import { judgeWin } from "./WinCondition";

type PlayerWithId = Player & {
  id: string;
};

type VoteMap = Record<string, string>;

function shuffle<T>(items: T[]) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [
      result[j],
      result[i],
    ];
  }

  return result;
}

function getAlivePlayers(players: PlayerWithId[]) {
  return players.filter(
    (player) => player.alive !== false
  );
}

function countVotes(
  players: PlayerWithId[],
  votes: VoteMap
) {
  const counts = new Map<string, number>();

  players.forEach((player) => {
    counts.set(player.id, 0);
  });

  Object.values(votes).forEach((targetId) => {
    counts.set(
      targetId,
      (counts.get(targetId) ?? 0) + 1
    );
  });

  return counts;
}

export async function submitVote(
  roomCode: string,
  voterId: string,
  targetId: string
) {
  const roomSnap = await get(
    ref(db, `rooms/${roomCode}`)
  );

  const room = roomSnap.val();

  if (!room || room.phase !== "vote") {
    return;
  }

  const players: PlayerWithId[] = Object.entries(
    room.players ?? {}
  ).map(([id, value]) => ({
    id,
    ...(value as Player),
  }));

  const alivePlayers = getAlivePlayers(players);
  const voter = alivePlayers.find(
    (player) => player.id === voterId
  );
  const target = alivePlayers.find(
    (player) => player.id === targetId
  );

  if (!voter || !target || voterId === targetId) {
    return;
  }

  const existingVotes: VoteMap =
    room.votes ?? {};

  if (existingVotes[voterId]) {
    return;
  }

  const votes = {
    ...existingVotes,
    [voterId]: targetId,
  };

  await update(ref(db, `rooms/${roomCode}`), {
    votes,
  });

  if (Object.keys(votes).length < alivePlayers.length) {
    return;
  }

  await finishVote(roomCode, players, votes);
}

async function finishVote(
  roomCode: string,
  players: PlayerWithId[],
  votes: VoteMap
) {
  const roomSnap = await get(
    ref(db, `rooms/${roomCode}`)
  );

  const room = roomSnap.val();

  if (!room || room.phase !== "vote") {
    return;
  }

  const alivePlayers = getAlivePlayers(players);
  const voteCounts = countVotes(alivePlayers, votes);
  const maxVoteCount = Math.max(
    ...voteCounts.values()
  );
  const exileCandidates = alivePlayers.filter(
    (player) =>
      voteCounts.get(player.id) === maxVoteCount
  );
  const exiledPlayer =
    shuffle(exileCandidates)[0];

  const remainingPlayers = alivePlayers.filter(
    (player) => player.id !== exiledPlayer.id
  );

  const voteResults: VoteResult[] =
    remainingPlayers.map((player) => ({
      playerId: player.id,
      voteCount: voteCounts.get(player.id) ?? 0,
    }));

  const day = room.day ?? 1;
  const time = new Date().toLocaleTimeString(
    "ja-JP",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
  const voteHistory = Object.entries(votes).map(
    ([voterId, targetId]) => ({
      voterId,
      voterName:
        players.find((player) => player.id === voterId)
          ?.name ?? "不明",
      targetId,
      targetName:
        players.find((player) => player.id === targetId)
          ?.name ?? "不明",
    })
  );

  const winResult = judgeWin(remainingPlayers);
  const gameEnded = winResult.winner !== null;
  const updates: Record<string, unknown> = {
    [`rooms/${roomCode}/players/${exiledPlayer.id}/alive`]:
      false,
    [`rooms/${roomCode}/lastEliminatedPlayerId`]:
      exiledPlayer.id,
    [`rooms/${roomCode}/voteResults`]: voteResults,
    [`rooms/${roomCode}/voteHistory/${day}`]: {
      day,
      votes: voteHistory,
    },
    [`rooms/${roomCode}/votes`]: null,
    [`rooms/${roomCode}/eveningChats`]: null,
    [`rooms/${roomCode}/gameLogs/vote-${day}`]: {
      id: `vote-${day}`,
      day,
      time,
      message: `${exiledPlayer.name} がコールドスリープになりました。`,
    },
    [`rooms/${roomCode}/phase`]: gameEnded
      ? "result"
      : "sleep",
  };

  if (gameEnded) {
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

  if (!gameEnded) {
    await createEveningGroups(roomCode, voteResults);
  }
}
