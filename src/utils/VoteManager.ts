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
type VoteStage =
  | "normal"
  | "runoff"
  | "exileDecision";

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

function getMaxVoteCandidates(
  players: PlayerWithId[],
  votes: VoteMap
) {
  const voteCounts = countVotes(players, votes);
  const maxVoteCount = Math.max(
    ...voteCounts.values()
  );

  return {
    voteCounts,
    maxVoteCount,
    candidates: players.filter(
      (player) =>
        voteCounts.get(player.id) === maxVoteCount
    ),
  };
}

function createVoteHistory(
  players: PlayerWithId[],
  votes: VoteMap
) {
  return Object.entries(votes).map(
    ([voterId, targetId]) => ({
      voterId,
      voterName:
        players.find((player) => player.id === voterId)
          ?.name ?? "不明",
      targetId,
      targetName:
        players.find((player) => player.id === targetId)
          ?.name ?? targetId,
    })
  );
}

function getTime() {
  return new Date().toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const voteStage: VoteStage =
    room.voteStage ?? "normal";
  const runoffCandidateIds: string[] =
    room.runoffCandidateIds ?? [];

  if (voteStage === "exileDecision") {
    return;
  }

  const voter = alivePlayers.find(
    (player) => player.id === voterId
  );
  const target = alivePlayers.find(
    (player) => player.id === targetId
  );

  if (!voter || !target || voterId === targetId) {
    return;
  }

  if (
    voteStage === "runoff" &&
    !runoffCandidateIds.includes(targetId)
  ) {
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

  await finishVote(
    roomCode,
    players,
    votes,
    voteStage
  );
}

export async function submitExileDecisionVote(
  roomCode: string,
  voterId: string,
  decision: "exileAll" | "noExile"
) {
  const roomSnap = await get(
    ref(db, `rooms/${roomCode}`)
  );

  const room = roomSnap.val();

  if (
    !room ||
    room.phase !== "vote" ||
    room.voteStage !== "exileDecision"
  ) {
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

  if (!voter) {
    return;
  }

  const existingVotes: VoteMap =
    room.votes ?? {};

  if (existingVotes[voterId]) {
    return;
  }

  const votes = {
    ...existingVotes,
    [voterId]: decision,
  };

  await update(ref(db, `rooms/${roomCode}`), {
    votes,
  });

  if (Object.keys(votes).length < alivePlayers.length) {
    return;
  }

  await finishExileDecisionVote(
    roomCode,
    players,
    votes
  );
}

async function finishVote(
  roomCode: string,
  players: PlayerWithId[],
  votes: VoteMap,
  voteStage: VoteStage
) {
  const roomSnap = await get(
    ref(db, `rooms/${roomCode}`)
  );

  const room = roomSnap.val();

  if (!room || room.phase !== "vote") {
    return;
  }

  const alivePlayers = getAlivePlayers(players);
  const {
    voteCounts,
    candidates: exileCandidates,
  } = getMaxVoteCandidates(
    alivePlayers,
    votes
  );
  const day = room.day ?? 1;
  const time = getTime();
  const stageKey =
    voteStage === "runoff" ? "runoff" : "normal";
  const voteHistory = createVoteHistory(
    players,
    votes
  );

  if (exileCandidates.length > 1) {
    const candidateIds = exileCandidates.map(
      (player) => player.id
    );
    const candidateNames = exileCandidates
      .map((player) => player.name)
      .join("、");

    await update(ref(db), {
      [`rooms/${roomCode}/votes`]: null,
      [`rooms/${roomCode}/voteStage`]:
        voteStage === "normal"
          ? "runoff"
          : "exileDecision",
      [`rooms/${roomCode}/runoffCandidateIds`]:
        candidateIds,
      [`rooms/${roomCode}/voteHistory/${day}-${stageKey}`]:
        {
          day,
          order: voteStage === "normal" ? 1 : 2,
          votes: voteHistory,
        },
      [`rooms/${roomCode}/gameLogs/vote-${day}-${stageKey}`]:
        {
          id: `vote-${day}-${stageKey}`,
          day,
          time,
          order: 10,
          message:
            voteStage === "normal"
              ? `${candidateNames} が同票でした。再会議後、最多票の人物だけで再投票します。`
              : `${candidateNames} が再投票でも同票でした。全員コールドスリープするか投票します。`,
        },
      [`rooms/${roomCode}/phase`]:
        voteStage === "normal"
          ? "discussion"
          : "vote",
      [`rooms/${roomCode}/phaseStartedAt`]: Date.now(),
    });

    return;
  }

  await finishWithExiledPlayers(
    roomCode,
    room,
    players,
    votes,
    voteCounts,
    exileCandidates,
    `${day}-${stageKey}`,
    voteStage === "runoff"
      ? "再投票"
      : "投票"
  );
}

async function finishExileDecisionVote(
  roomCode: string,
  players: PlayerWithId[],
  votes: VoteMap
) {
  const roomSnap = await get(
    ref(db, `rooms/${roomCode}`)
  );

  const room = roomSnap.val();

  if (
    !room ||
    room.phase !== "vote" ||
    room.voteStage !== "exileDecision"
  ) {
    return;
  }

  const alivePlayers = getAlivePlayers(players);
  const runoffCandidateIds: string[] =
    room.runoffCandidateIds ?? [];
  const exileAllCount = Object.values(votes).filter(
    (value) => value === "exileAll"
  ).length;
  const noExileCount = Object.values(votes).filter(
    (value) => value === "noExile"
  ).length;
  const day = room.day ?? 1;
  const time = getTime();
  const targetPlayers = alivePlayers.filter((player) =>
    runoffCandidateIds.includes(player.id)
  );
  const voteCounts = countVotes(alivePlayers, {});
  const decisionHistory = Object.entries(votes).map(
    ([voterId, decision]) => ({
      voterId,
      voterName:
        players.find((player) => player.id === voterId)
          ?.name ?? "不明",
      targetId: decision,
      targetName:
        decision === "exileAll"
          ? "全員コールドスリープ"
          : "誰もコールドスリープしない",
    })
  );

  if (exileAllCount > noExileCount) {
    await finishWithExiledPlayers(
      roomCode,
      room,
      players,
      votes,
      voteCounts,
      targetPlayers,
      `${day}-exileDecision`,
      "コールドスリープ可否投票",
      decisionHistory
    );

    return;
  }

  const voteResults: VoteResult[] =
    alivePlayers.map((player) => ({
      playerId: player.id,
      voteCount: 0,
    }));
  const updates: Record<string, unknown> = {
    [`rooms/${roomCode}/lastEliminatedPlayerId`]:
      null,
    [`rooms/${roomCode}/lastEliminatedPlayerIds`]:
      [],
    [`rooms/${roomCode}/voteResults`]: voteResults,
    [`rooms/${roomCode}/voteHistory/${day}-exileDecision`]:
      {
        day,
        order: 3,
        votes: decisionHistory,
      },
    [`rooms/${roomCode}/votes`]: null,
    [`rooms/${roomCode}/voteStage`]: null,
    [`rooms/${roomCode}/runoffCandidateIds`]: null,
    [`rooms/${roomCode}/eveningChats`]: null,
    [`rooms/${roomCode}/gameLogs/vote-${day}-exileDecision`]:
      {
        id: `vote-${day}-exileDecision`,
        day,
        time,
        order: 10,
        message:
          "コールドスリープ可否投票の結果、誰もコールドスリープしませんでした。",
      },
    [`rooms/${roomCode}/phase`]: "sleep",
    [`rooms/${roomCode}/phaseStartedAt`]: Date.now(),
  };

  await update(ref(db), updates);
  await createEveningGroups(roomCode, voteResults);
}

async function finishWithExiledPlayers(
  roomCode: string,
  room: {
    day?: number;
  },
  players: PlayerWithId[],
  votes: VoteMap,
  voteCounts: Map<string, number>,
  exiledPlayers: PlayerWithId[],
  historyKey: string,
  actionLabel: string,
  history = createVoteHistory(players, votes)
) {
  const alivePlayers = getAlivePlayers(players);
  const exiledPlayerIds = exiledPlayers.map(
    (player) => player.id
  );
  const remainingPlayers = alivePlayers.filter(
    (player) => !exiledPlayerIds.includes(player.id)
  );

  const voteResults: VoteResult[] =
    remainingPlayers.map((player) => ({
      playerId: player.id,
      voteCount: voteCounts.get(player.id) ?? 0,
    }));

  const day = room.day ?? 1;
  const time = getTime();
  const exiledNames = exiledPlayers
    .map((player) => player.name)
    .join("、");

  const winResult = judgeWin(remainingPlayers);
  const gameEnded = winResult.winner !== null;
  const updates: Record<string, unknown> = {
    [`rooms/${roomCode}/lastEliminatedPlayerId`]:
      exiledPlayers[0]?.id ?? null,
    [`rooms/${roomCode}/lastEliminatedPlayerIds`]:
      exiledPlayerIds,
    [`rooms/${roomCode}/voteResults`]: voteResults,
    [`rooms/${roomCode}/voteHistory/${historyKey}`]: {
      day,
      order: actionLabel === "再投票" ? 2 : 1,
      votes: history,
    },
    [`rooms/${roomCode}/votes`]: null,
    [`rooms/${roomCode}/voteStage`]: null,
    [`rooms/${roomCode}/runoffCandidateIds`]: null,
    [`rooms/${roomCode}/eveningChats`]: null,
    [`rooms/${roomCode}/gameLogs/vote-${historyKey}`]: {
      id: `vote-${historyKey}`,
      day,
      time,
      order: 10,
      message: `${actionLabel}の結果、${exiledNames} がコールドスリープになりました。`,
    },
    [`rooms/${roomCode}/phase`]: gameEnded
      ? "result"
      : "sleep",
    [`rooms/${roomCode}/phaseStartedAt`]: Date.now(),
  };

  exiledPlayers.forEach((player) => {
    updates[
      `rooms/${roomCode}/players/${player.id}/alive`
    ] = false;
    updates[
      `rooms/${roomCode}/players/${player.id}/eliminationReason`
    ] = "coldSleep";
  });

  if (gameEnded) {
    updates[`rooms/${roomCode}/winner`] =
      winResult.winner;
    updates[`rooms/${roomCode}/gameLogs/result-${day}`] =
      {
        id: `result-${day}`,
        day,
        time,
        order: 90,
        message: winResult.message,
      };
  }

  await update(ref(db), updates);

  if (!gameEnded) {
    await createEveningGroups(roomCode, voteResults);
  }
}
