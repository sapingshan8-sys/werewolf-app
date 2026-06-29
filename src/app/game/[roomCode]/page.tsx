"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  ref,
  onValue,
  runTransaction,
  update,
} from "firebase/database";
import type { Player } from "@/types/player";
import type { RoleCounts } from "@/lib/roles";
import DiscussionPhase from "@/components/game/phases/DiscussionPhase";
import VotePhase from "@/components/game/phases/VotePhase";
import EveningPhase from "@/components/game/phases/EveningPhase";
import NightPhase from "@/components/game/phases/NightPhase";
import MorningPhase from "@/components/game/phases/MorningPhase";
import ResultPhase from "@/components/game/phases/ResultPhase";
import RoleRevealChat from "@/components/game/roleReveal/RoleRevealChat";
import {
  submitExileDecisionVote,
  submitVote,
} from "@/utils/VoteManager";
import { finishEveningIfReady } from "@/utils/EveningManager";
import { submitNightAction } from "@/utils/NightManager";
import { getPlayerSession } from "@/lib/playerSession";

type PlayerWithId = Player & {
  id: string;
};

type VoteMap = Record<string, string>;
type NightActionMap = Record<
  string,
  {
    role?: string;
    targetId?: string;
    finished?: boolean;
  }
>;
type EngineerResultMap = Record<
  string,
  {
    targetId: string;
    isGnosia: boolean;
  }
>;
type EngineerInvestigationHistory = Record<
  string,
  Record<string, true>
>;
type DoctorResult = {
  targetId: string;
  isHuman: boolean;
} | null;
type GameLogEntry = {
  id: string;
  day: number;
  time: string;
  message: string;
  order?: number;
};
type VoteHistoryDay = {
  day: number;
  order?: number;
  votes: {
    voterName: string;
    targetName: string;
  }[];
};
type EveningChatRoom = {
  members?: string[];
  roomName?: string;
};

const roleNames: Record<string, string> = {
  crew: "乗員",
  gnosia: "グノーシア",
  engineer: "エンジニア",
  doctor: "ドクター",
  guardianAngel: "守護天使",
  guardDuty: "留守番",
  acFollower: "AC主義者",
  bug: "バグ",
};

const phaseOrder = [
  "roleReveal",
  "discussion",
  "vote",
  "sleep",
  "evening",
  "night",
  "morning",
  "result",
];

function getGameLogOrder(log: GameLogEntry) {
  if (typeof log.order === "number") {
    return log.order;
  }

  if (log.id.startsWith("vote-")) {
    return 10;
  }

  if (log.id.startsWith("night-")) {
    return 20;
  }

  if (log.id.startsWith("result-")) {
    return 90;
  }

  return 50;
}

export default function GamePage() {
  const params = useParams();
  const router = useRouter();

  const roomCode = params.roomCode as string;

  const [players, setPlayers] = useState<PlayerWithId[]>([]);
  const [myPlayerId] = useState(() =>
    getPlayerSession().playerId
  );
  const [hostId, setHostId] = useState("");
  const [phase, setPhase] = useState("");
  const [day, setDay] = useState(1);
  const [roleCounts, setRoleCounts] =
    useState<RoleCounts>({});
  const [lastEliminatedPlayerId, setLastEliminatedPlayerId] =
    useState("");
  const [lastEliminatedPlayerIds, setLastEliminatedPlayerIds] =
    useState<string[]>([]);
  const [votes, setVotes] = useState<VoteMap>({});
  const [voteStage, setVoteStage] =
    useState("normal");
  const [runoffCandidateIds, setRunoffCandidateIds] =
    useState<string[]>([]);
  const [nightActions, setNightActions] =
    useState<NightActionMap>({});
  const [gnosiaAttackTargetId, setGnosiaAttackTargetId] =
    useState("");
  const [attackedPlayerId, setAttackedPlayerId] =
    useState("");
  const [protectedSuccess, setProtectedSuccess] =
    useState(false);
  const [bugKilledIds, setBugKilledIds] = useState<
    string[]
  >([]);
  const [engineerResults, setEngineerResults] =
    useState<EngineerResultMap>({});
  const [
    engineerInvestigationHistory,
    setEngineerInvestigationHistory,
  ] = useState<EngineerInvestigationHistory>({});
  const [doctorResults, setDoctorResults] =
    useState<DoctorResult>(null);
  const [winner, setWinner] = useState("");
  const [gameLogs, setGameLogs] = useState<
    GameLogEntry[]
  >([]);
  const [voteHistory, setVoteHistory] = useState<
    VoteHistoryDay[]
  >([]);
  const [eveningChats, setEveningChats] = useState<
    Record<string, EveningChatRoom>
  >({});
  const [voteError, setVoteError] = useState("");
  const [isVoteSubmitting, setIsVoteSubmitting] =
    useState(false);

  useEffect(() => {
    // ルーム監視
    const roomRef = ref(db, `rooms/${roomCode}`);

    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      const room = snapshot.val();

      if (!room) return;

      if (room.status === "waiting") {
        router.push(`/room/${roomCode}`);
        return;
      }

      setPhase(room.phase ?? "");
      setHostId(room.hostId ?? "");
      setDay(room.day ?? 1);
      setRoleCounts(room.roleCounts ?? {});
      setLastEliminatedPlayerId(
        room.lastEliminatedPlayerId ?? ""
      );
      setLastEliminatedPlayerIds(
        room.lastEliminatedPlayerIds ?? []
      );
      setVotes(room.votes ?? {});
      setVoteStage(room.voteStage ?? "normal");
      setRunoffCandidateIds(
        room.runoffCandidateIds ?? []
      );
      setNightActions(room.nightActions ?? {});
      setGnosiaAttackTargetId(
        room.gnosiaAttackTargetId ?? ""
      );
      setAttackedPlayerId(room.attackedPlayerId ?? "");
      setProtectedSuccess(
        room.protectedSuccess ?? false
      );
      setBugKilledIds(room.bugKilledIds ?? []);
      setEngineerResults(room.engineerResults ?? {});
      setEngineerInvestigationHistory(
        room.engineerInvestigationHistory ?? {}
      );
      setDoctorResults(room.doctorResults ?? null);
      setWinner(room.winner ?? "");
      setEveningChats(room.eveningChats ?? {});

      const logs = Object.values(
        room.gameLogs ?? {}
      ) as GameLogEntry[];

      setGameLogs(
        logs.sort((a, b) => {
          if (a.day !== b.day) {
            return a.day - b.day;
          }

          const orderDiff =
            getGameLogOrder(a) - getGameLogOrder(b);

          if (orderDiff !== 0) {
            return orderDiff;
          }

          return a.id.localeCompare(b.id);
        })
      );

      const votes = Object.values(
        room.voteHistory ?? {}
      ) as VoteHistoryDay[];

      setVoteHistory(
        votes.sort((a, b) => {
          if (a.day !== b.day) {
            return a.day - b.day;
          }

          return (a.order ?? 0) - (b.order ?? 0);
        })
      );
    });

    // プレイヤー監視
    const playersRef = ref(db, `rooms/${roomCode}/players`);

    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setPlayers([]);
        return;
      }

      const playerList: PlayerWithId[] = Object.entries(data).map(
        ([id, value]) => ({
          id,
          ...(value as Player),
        })
      );

      setPlayers(playerList);
    });

    return () => {
      unsubscribeRoom();
      unsubscribePlayers();
    };
  }, [roomCode, router]);

  const me = players.find(
    (player) => player.id === myPlayerId
  );
  const lastEliminatedPlayer = players.find(
    (player) => player.id === lastEliminatedPlayerId
  );
  const lastEliminatedPlayers =
    lastEliminatedPlayerIds.length > 0
      ? players.filter((player) =>
          lastEliminatedPlayerIds.includes(player.id)
        )
      : lastEliminatedPlayer
        ? [lastEliminatedPlayer]
        : [];
  const eliminatedPlayerIds = Array.from(
    new Set([attackedPlayerId, ...bugKilledIds].filter(Boolean))
  );
  const morningEliminatedPlayers = players.filter(
    (player) => eliminatedPlayerIds.includes(player.id)
  );
  const myEngineerResult =
    engineerResults[myPlayerId];
  const myInvestigatedTargetIds = Object.keys(
    engineerInvestigationHistory[myPlayerId] ?? {}
  );
  const engineerTarget = players.find(
    (player) =>
      player.id === myEngineerResult?.targetId
  );
  const doctorTarget = players.find(
    (player) =>
      player.id === doctorResults?.targetId
  );
  const isSpectator = me?.alive === false;
  const myEliminationLabel =
    me?.eliminationReason === "attack"
      ? "消滅しています"
      : me?.eliminationReason === "bug"
        ? "バグとして消滅しています"
        : "コールドスリープ中です";
  const eveningPartners = players.filter(
    (player) =>
      player.chatId &&
      player.chatId === me?.chatId &&
      player.id !== myPlayerId &&
      player.alive !== false
  );
  const eveningRoomName = me?.chatId
    ? eveningChats[me.chatId]?.roomName
    : "";
  const previousVoteHistory = voteHistory.filter(
    (history) =>
      history.day < day || voteStage === "runoff"
  );
  const runoffCandidates = players.filter((player) =>
    runoffCandidateIds.includes(player.id)
  );
  const knownPartners = players.filter(
    (player) =>
      player.id !== myPlayerId &&
      ((me?.role === "gnosia" &&
        player.role === "gnosia") ||
        (me?.role === "guardDuty" &&
          player.role === "guardDuty"))
  );
  const coldSleepFocus = lastEliminatedPlayers[0];
  const coldSleepNames = lastEliminatedPlayers
    .map((player) => player.name)
    .join("、");
  const coldSleepAnnouncement =
    lastEliminatedPlayers.length > 0
      ? `${coldSleepNames}がコールドスリープしました`
      : "本日は誰もコールドスリープしませんでした";

  const nextPhase = async () => {
    const currentIndex = phaseOrder.indexOf(phase);

    if (currentIndex === -1) return;

    if (currentIndex >= phaseOrder.length - 1) {
      return;
    }

    const next = phaseOrder[currentIndex + 1];

    await update(ref(db, `rooms/${roomCode}`), {
      phase: next,
      ...(next === "vote"
        ? {
            votes: null,
            voteStage:
              voteStage === "runoff"
                ? "runoff"
                : "normal",
            runoffCandidateIds:
              voteStage === "runoff"
                ? runoffCandidateIds
                : null,
          }
        : {}),
    });
  };

  const votePlayer = async (targetId: string) => {
    if (!myPlayerId) {
      setVoteError(
        "プレイヤー情報を取得できませんでした。ルームに入り直してください。"
      );
      return;
    }

    try {
      setVoteError("");
      setIsVoteSubmitting(true);

      await submitVote(
        roomCode,
        myPlayerId,
        targetId
      );
    } catch (error) {
      console.error(error);
      setVoteError(
        "投票に失敗しました。通信状態を確認してもう一度試してください。"
      );
    } finally {
      setIsVoteSubmitting(false);
    }
  };

  const voteExileDecision = async (
    decision: "exileAll" | "noExile"
  ) => {
    if (!myPlayerId) {
      setVoteError(
        "プレイヤー情報を取得できませんでした。ルームに入り直してください。"
      );
      return;
    }

    try {
      setVoteError("");
      setIsVoteSubmitting(true);

      await submitExileDecisionVote(
        roomCode,
        myPlayerId,
        decision
      );
    } catch (error) {
      console.error(error);
      setVoteError(
        "投票に失敗しました。通信状態を確認してもう一度試してください。"
      );
    } finally {
      setIsVoteSubmitting(false);
    }
  };

  const finishEvening = async () => {
    if (!myPlayerId || isSpectator) {
      return;
    }

    await finishEveningIfReady(
      roomCode,
      myPlayerId
    );
  };

  const submitMyNightAction = async (
    targetId?: string
  ) => {
    if (!me) {
      return;
    }

    await submitNightAction(
      roomCode,
      me,
      targetId
    );
  };

  const selectGnosiaAttackTarget = async (
    targetId: string
  ) => {
    await runTransaction(
      ref(db, `rooms/${roomCode}/gnosiaAttackTargetId`),
      (currentTargetId) => currentTargetId ?? targetId
    );
  };

  const finishMorning = async () => {
    await update(ref(db, `rooms/${roomCode}`), {
      phase: "discussion",
    });
  };

  const restartInSameRoom = async () => {
    const updates: Record<string, unknown> = {
      [`rooms/${roomCode}/status`]: "waiting",
      [`rooms/${roomCode}/phase`]: null,
      [`rooms/${roomCode}/day`]: 1,
      [`rooms/${roomCode}/votes`]: null,
      [`rooms/${roomCode}/voteStage`]: null,
      [`rooms/${roomCode}/runoffCandidateIds`]: null,
      [`rooms/${roomCode}/nightActions`]: null,
      [`rooms/${roomCode}/gnosiaAttackTargetId`]: null,
      [`rooms/${roomCode}/gnosiaChats`]: null,
      [`rooms/${roomCode}/roleRevealChats`]: null,
      [`rooms/${roomCode}/discussionChats`]: null,
      [`rooms/${roomCode}/eveningChats`]: null,
      [`rooms/${roomCode}/lastEliminatedPlayerId`]: null,
      [`rooms/${roomCode}/lastEliminatedPlayerIds`]: null,
      [`rooms/${roomCode}/attackedPlayerId`]: null,
      [`rooms/${roomCode}/protectedSuccess`]: false,
      [`rooms/${roomCode}/bugKilled`]: false,
      [`rooms/${roomCode}/bugKilledIds`]: null,
      [`rooms/${roomCode}/engineerResults`]: null,
      [`rooms/${roomCode}/engineerInvestigationHistory`]:
        null,
      [`rooms/${roomCode}/doctorResults`]: null,
      [`rooms/${roomCode}/winner`]: null,
      [`rooms/${roomCode}/gameLogs`]: null,
      [`rooms/${roomCode}/voteHistory`]: null,
    };

    players.forEach((player) => {
      updates[
        `rooms/${roomCode}/players/${player.id}/role`
      ] = null;
      updates[
        `rooms/${roomCode}/players/${player.id}/alive`
      ] = true;
      updates[
        `rooms/${roomCode}/players/${player.id}/eliminationReason`
      ] = null;
      updates[
        `rooms/${roomCode}/players/${player.id}/chatId`
      ] = null;
      updates[
        `rooms/${roomCode}/players/${player.id}/eveningFinished`
      ] = null;
    });

    await update(ref(db), updates);
    router.push(`/room/${roomCode}`);
  };

  if (!me) {
    return <div className="p-8">読み込み中...</div>;
  }

  const renderPhaseContent = () => {
    switch (phase) {
      case "roleReveal":
        return (
          <main className="relative min-h-screen overflow-hidden bg-[#d8eff8] px-8 pb-36 pt-8 text-[#2e2c2c]">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(220,246,255,0.96)_0%,rgba(189,227,238,0.9)_45%,rgba(235,239,238,0.96)_100%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.8)_0%,transparent_28%),radial-gradient(circle_at_76%_70%,rgba(113,190,199,0.22)_0%,transparent_34%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_2px,transparent_2px,transparent_7px)]" />

            <div className="relative z-10 mx-auto flex min-h-[calc(100vh-11rem)] max-w-6xl items-center gap-12">
              <section className="w-[26rem] shrink-0 bg-white/78 p-6 shadow-[0_0_0_4px_rgba(255,255,255,0.82),5px_5px_0_rgba(0,0,0,0.22)]">
                <Image
                  src={`/characters/${me.character}.png`}
                  alt={me.character ?? ""}
                  width={360}
                  height={360}
                  priority
                  className="mx-auto aspect-square object-cover"
                />

                <p className="mt-5 text-center text-3xl font-light tracking-[0.12em]">
                  {me.name}
                </p>
              </section>

              <section className="min-w-0 flex-1">
                <div className="mb-8 inline-block bg-white/88 px-10 py-4 shadow-[0_0_0_4px_rgba(255,255,255,0.86),4px_4px_0_rgba(0,0,0,0.22)]">
                  <h2 className="text-4xl font-light tracking-[0.16em]">
                    役職提示
                  </h2>
                </div>

                <div className="relative border-4 border-white/88 bg-[#727681]/82 text-white shadow-[4px_4px_0_rgba(0,0,0,0.18)]">
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.12)_0px,rgba(255,255,255,0.12)_2px,transparent_2px,transparent_8px)]" />

                  <div className="relative z-10 px-12 py-10">
                    <p className="text-lg tracking-[0.28em] text-white/72">
                      YOUR ROLE
                    </p>

                    <p className="mt-3 text-6xl font-light tracking-[0.18em]">
                      {roleNames[me.role ?? ""] ?? "？？？"}
                    </p>
                  </div>
                </div>

            {(me.role === "gnosia" ||
              me.role === "guardDuty") && (
              <div className="relative mt-8 border-4 border-white/82 bg-[#727681]/72 text-white shadow-[4px_4px_0_rgba(0,0,0,0.16)]">
                <div className="relative z-10 p-6">
                <h3 className="text-2xl font-light tracking-[0.16em]">
                  相方
                </h3>

                {knownPartners.length === 0 ? (
                  <p className="mt-4 text-white/84">
                    相方はいません。
                  </p>
                ) : (
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    {knownPartners.map((partner) => (
                      <div
                        key={partner.id}
                        className="bg-white/72 p-3 text-center text-[#2e2c2c] shadow-[0_0_0_3px_rgba(255,255,255,0.72)]"
                      >
                        <Image
                          src={
                            partner.character
                              ? `/characters/${partner.character}.png`
                              : "/characters/question.png"
                          }
                          alt={
                            partner.character ??
                            "未選択"
                          }
                          width={100}
                          height={100}
                          className="mx-auto aspect-square object-cover"
                        />

                        <p className="mt-2 font-bold">
                          {partner.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </div>
            )}

            {(me.role === "gnosia" ||
              me.role === "guardDuty") && (
              <RoleRevealChat
                roomCode={roomCode}
                chatKey={me.role}
                myPlayerId={myPlayerId}
                myName={me.name}
                title={
                  me.role === "gnosia"
                    ? "グノーシアチャット"
                    : "留守番チャット"
                }
              />
            )}
              </section>
            </div>

            {myPlayerId === hostId ? (
              <div className="absolute bottom-8 right-12 z-20">
                <button
                  onClick={nextPhase}
                  className="border-4 border-white/88 bg-[#727681]/82 px-10 py-5 text-3xl font-light tracking-[0.08em] text-white shadow-[4px_4px_0_rgba(0,0,0,0.18)] transition hover:bg-[#626975]"
                >
                  次へ
                </button>
              </div>
            ) : (
              <p className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 border-2 border-white/72 bg-white/72 px-8 py-3 text-sm tracking-[0.12em] text-[#3e3b3b] shadow-[0_0_0_3px_rgba(255,255,255,0.38)]">
                ホストが次のフェーズへ進めるまでお待ちください。
              </p>
            )}
          </main>
        );

      case "discussion":
        return (
          <DiscussionPhase
            roomCode={roomCode}
            day={day}
            players={players}
            myPlayer={me}
            isSpectator={isSpectator}
            roleCounts={roleCounts}
            voteHistory={previousVoteHistory}
            voteStage={voteStage}
            runoffCandidates={runoffCandidates}
            canProceed={myPlayerId === hostId}
            onProceed={nextPhase}
          />
        );

      case "vote":
        return (
          <VotePhase
            players={players}
            myPlayerId={myPlayerId}
            currentVoteTargetId={votes[myPlayerId]}
            voteStage={voteStage}
            runoffCandidateIds={runoffCandidateIds}
            errorMessage={voteError}
            isSubmitting={isVoteSubmitting}
            submittedCount={Object.keys(votes).length}
            votePlayer={votePlayer}
            voteExileDecision={voteExileDecision}
          />
        );

      case "sleep":
        return (
          <main className="relative min-h-screen overflow-hidden bg-black px-8 py-8 text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_42%,rgba(43,86,112,0.42)_0%,rgba(3,8,15,0.56)_30%,rgba(0,0,0,0.98)_68%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,1)_0%,rgba(0,0,0,0.94)_42%,rgba(0,0,0,0.34)_72%,rgba(0,0,0,0.7)_100%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.035)_0px,rgba(255,255,255,0.035)_2px,transparent_2px,transparent_7px)]" />

            {coldSleepFocus && (
              <div className="absolute bottom-0 right-[-3rem] top-0 w-[46rem] opacity-55">
                <Image
                  src={
                    coldSleepFocus.character
                      ? `/characters/${coldSleepFocus.character}.png`
                      : "/characters/question.png"
                  }
                  alt={
                    coldSleepFocus.character ?? "未選択"
                  }
                  fill
                  priority
                  sizes="760px"
                  className="object-cover object-center saturate-[0.85]"
                />
              </div>
            )}

            <div className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center">
              <section className="relative w-[min(78rem,78vw)] p-1">
                <div className="absolute inset-0 bg-white/82 shadow-[8px_8px_0_rgba(255,255,255,0.16)] [clip-path:polygon(5%_0,100%_0,100%_78%,91%_100%,0_100%,0_15%)]" />
                <div className="absolute inset-[5px] bg-[#656875]/72 [clip-path:polygon(5%_0,100%_0,100%_78%,91%_100%,0_100%,0_15%)]" />
                <div className="absolute inset-[5px] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.12)_0px,rgba(255,255,255,0.12)_2px,transparent_2px,transparent_8px)] [clip-path:polygon(5%_0,100%_0,100%_78%,91%_100%,0_100%,0_15%)]" />

                <div className="relative z-10 flex min-h-72 items-center justify-center px-16 py-12">
                  <p className="text-center text-4xl font-light leading-relaxed tracking-[0.12em] text-white drop-shadow">
                    {coldSleepAnnouncement}
                  </p>
                </div>

                {lastEliminatedPlayers.length > 1 && (
                  <div className="relative z-10 mx-auto mb-9 flex max-w-4xl flex-wrap justify-center gap-3 px-10">
                    {lastEliminatedPlayers.map((player) => (
                      <span
                        key={player.id}
                        className="bg-white/16 px-5 py-2 text-lg tracking-[0.08em] shadow-[0_0_0_2px_rgba(255,255,255,0.48)] [clip-path:polygon(10%_0,100%_0,92%_100%,0_100%,0_32%)]"
                      >
                        {player.name}
                      </span>
                    ))}
                  </div>
                )}

                {myPlayerId === hostId && (
                  <div className="absolute bottom-[-5rem] right-4 z-20">
                <button
                  onClick={nextPhase}
                      className="relative h-28 w-56 p-1 text-white transition hover:translate-x-[-2px]"
                >
                      <span className="absolute inset-0 bg-white/86 shadow-[5px_5px_0_rgba(255,255,255,0.14)] [clip-path:polygon(18%_0,100%_0,100%_70%,82%_100%,0_100%,0_34%)]" />
                      <span className="absolute inset-[5px] bg-[#727681]/78 [clip-path:polygon(18%_0,100%_0,100%_70%,82%_100%,0_100%,0_34%)]" />
                      <span className="absolute inset-[5px] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.13)_0px,rgba(255,255,255,0.13)_2px,transparent_2px,transparent_8px)] [clip-path:polygon(18%_0,100%_0,100%_70%,82%_100%,0_100%,0_34%)]" />
                      <span className="absolute bottom-5 left-5 h-8 w-20 border-2 border-white/90 text-base leading-7 text-white/90">
                        NEXT
                      </span>
                      <span className="relative z-10 block pl-16 pt-6 text-4xl font-light tracking-[0.08em]">
                        次へ
                      </span>
                </button>
              </div>
            )}
              </section>
            </div>
          </main>
        );

      case "evening":
        if (isSpectator) {
          return (
            <main className="relative min-h-screen overflow-hidden bg-[#d8eff8] px-8 py-8 text-[#2e2c2c]">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(220,246,255,0.96)_0%,rgba(189,227,238,0.9)_45%,rgba(235,239,238,0.96)_100%)]" />
              <div className="relative z-10 mx-auto max-w-4xl py-16">
                <div className="inline-block bg-white/88 px-10 py-4 pr-24 shadow-[0_0_0_4px_rgba(255,255,255,0.86),4px_4px_0_rgba(0,0,0,0.28)] [clip-path:polygon(0_0,100%_0,92%_100%,0_100%)]">
                  <h2 className="text-4xl font-light tracking-[0.16em]">
                    自由時間
                  </h2>
                </div>

                <p className="mt-8 bg-white/74 p-6 text-xl shadow-[0_0_0_4px_rgba(255,255,255,0.72)] [clip-path:polygon(5%_0,100%_0,96%_100%,0_100%,0_20%)]">
                  あなたは閲覧者モードのため、会話には参加しません。
                </p>

              {lastEliminatedPlayer && (
                <div className="mt-10 bg-white/74 p-6 shadow-[0_0_0_4px_rgba(255,255,255,0.72)] [clip-path:polygon(5%_0,100%_0,96%_100%,0_100%,0_20%)]">
                  <h3 className="mb-5 text-2xl font-light tracking-[0.12em]">
                    本日のコールドスリープ
                  </h3>

                  <div className="flex flex-col items-center text-center">
                    <Image
                      src={
                        lastEliminatedPlayer.character
                          ? `/characters/${lastEliminatedPlayer.character}.png`
                          : "/characters/question.png"
                      }
                      alt={
                        lastEliminatedPlayer.character ??
                        "未選択"
                      }
                      width={160}
                      height={160}
                      className="aspect-square object-cover"
                    />

                    <p className="mt-4 text-2xl font-bold">
                      {lastEliminatedPlayer.name}
                    </p>
                  </div>
                </div>
              )}
              </div>
            </main>
          );
        }

        if (!me.chatId) {
          return (
            <main className="relative min-h-screen bg-[#d8eff8] px-8 py-20 text-center">
              <h2 className="text-4xl font-light tracking-[0.16em]">
                自由時間
              </h2>

              <p className="mt-6 text-xl">
                会話グループを読み込み中です。
              </p>
            </main>
          );
        }

        return (
          <EveningPhase
            roomCode={roomCode}
            myPlayer={me}
            partners={eveningPartners}
            chatId={me.chatId}
            roomName={eveningRoomName}
            onTimerFinish={finishEvening}
          />
        );

      case "night":
        if (isSpectator) {
          return (
            <div className="py-16">
              <h2 className="text-4xl font-bold">
                夜
              </h2>

              <p className="mt-6 text-xl text-gray-700">
                あなたは閲覧者モードのため、夜行動には参加しません。
              </p>
            </div>
          );
        }

        return (
          <NightPhase
            roomCode={roomCode}
            day={day}
            myPlayer={me}
            players={players}
            lastEliminatedPlayer={lastEliminatedPlayer}
            alreadyFinished={
              nightActions[myPlayerId]?.finished === true
            }
            gnosiaAttackTargetId={gnosiaAttackTargetId}
            investigatedTargetIds={myInvestigatedTargetIds}
            onSelectGnosiaAttackTarget={
              selectGnosiaAttackTarget
            }
            onSubmitAction={submitMyNightAction}
          />
        );

      case "morning":
        return (
          <MorningPhase
            eliminatedPlayers={morningEliminatedPlayers.map(
              (player) => ({
                name: player.name,
                character: player.character,
              })
            )}
            protectedSuccess={protectedSuccess}
            engineerResult={
              me.role === "engineer" &&
              myEngineerResult &&
              engineerTarget
                ? {
                    targetName: engineerTarget.name,
                    targetCharacter:
                      engineerTarget.character,
                    isGnosia:
                      myEngineerResult.isGnosia,
                  }
                : undefined
            }
            doctorResult={
              me.role === "doctor" &&
              doctorResults &&
              doctorTarget
                ? {
                    targetName: doctorTarget.name,
                    targetCharacter:
                      doctorTarget.character,
                    isHuman:
                      doctorResults.isHuman,
                  }
                : undefined
            }
            onFinish={
              myPlayerId === hostId
                ? finishMorning
                : undefined
            }
            canProceed={myPlayerId === hostId}
          />
        );

      case "result":
        return (
          <ResultPhase
            players={players}
            winner={winner}
            logs={gameLogs}
            voteHistory={voteHistory}
            canRestart={myPlayerId === hostId}
            onRestart={restartInSameRoom}
          />
        );

      default:
        return (
          <div className="text-center py-20">
            フェーズを読み込み中...
          </div>
        );
    }
  };

  if (
    phase === "discussion" ||
    phase === "roleReveal" ||
    phase === "sleep" ||
    phase === "evening" ||
    phase === "night" ||
    phase === "morning" ||
    phase === "result"
  ) {
    return renderPhaseContent();
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      {isSpectator && (
        <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="text-xl font-bold text-red-700">
            閲覧者モード
          </h2>

          <p className="mt-2 text-gray-700">
            あなたは{myEliminationLabel}。
            以降の投票や夜行動には参加せず、進行を閲覧します。
          </p>
        </div>
      )}

      {myPlayerId === hostId &&
        phase !== "discussion" &&
        phase !== "vote" &&
        phase !== "sleep" &&
        phase !== "evening" &&
        phase !== "night" &&
        phase !== "morning" && (
        <div className="mb-8">
          <button
            onClick={nextPhase}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            次のフェーズへ
          </button>
        </div>
      )}

      {renderPhaseContent()}

    </div>
  );
}
