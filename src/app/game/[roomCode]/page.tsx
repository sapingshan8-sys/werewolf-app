"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";
import type { Player } from "@/types/player";
import DiscussionPhase from "@/components/game/phases/DiscussionPhase";
import VotePhase from "@/components/game/phases/VotePhase";
import EveningPhase from "@/components/game/phases/EveningPhase";
import NightPhase from "@/components/game/phases/NightPhase";
import MorningPhase from "@/components/game/phases/MorningPhase";
import ResultPhase from "@/components/game/phases/ResultPhase";
import { submitVote } from "@/utils/VoteManager";
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
type DoctorResult = {
  targetId: string;
  isHuman: boolean;
} | null;
type GameLogEntry = {
  id: string;
  day: number;
  time: string;
  message: string;
};
type VoteHistoryDay = {
  day: number;
  votes: {
    voterName: string;
    targetName: string;
  }[];
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

const phaseNames: Record<string, string> = {
  roleReveal: "役職確認",
  discussion: "議論",
  vote: "投票",
  sleep: "コールドスリープ",
  evening: "夕方",
  night: "夜",
  morning: "朝",
  result: "ゲーム終了",
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

export default function GamePage() {
  const params = useParams();

  const roomCode = params.roomCode as string;

  const [players, setPlayers] = useState<PlayerWithId[]>([]);
  const [myPlayerId] = useState(() =>
    getPlayerSession().playerId
  );
  const [hostId, setHostId] = useState("");
  const [phase, setPhase] = useState("");
  const [day, setDay] = useState(1);
  const [lastEliminatedPlayerId, setLastEliminatedPlayerId] =
    useState("");
  const [votes, setVotes] = useState<VoteMap>({});
  const [nightActions, setNightActions] =
    useState<NightActionMap>({});
  const [attackedPlayerId, setAttackedPlayerId] =
    useState("");
  const [protectedSuccess, setProtectedSuccess] =
    useState(false);
  const [bugKilled, setBugKilled] =
    useState(false);
  const [engineerResults, setEngineerResults] =
    useState<EngineerResultMap>({});
  const [doctorResults, setDoctorResults] =
    useState<DoctorResult>(null);
  const [winner, setWinner] = useState("");
  const [gameLogs, setGameLogs] = useState<
    GameLogEntry[]
  >([]);
  const [voteHistory, setVoteHistory] = useState<
    VoteHistoryDay[]
  >([]);
  const [voteError, setVoteError] = useState("");
  const [isVoteSubmitting, setIsVoteSubmitting] =
    useState(false);

  useEffect(() => {
    // ルーム監視
    const roomRef = ref(db, `rooms/${roomCode}`);

    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      const room = snapshot.val();

      if (!room) return;

      setPhase(room.phase ?? "");
      setHostId(room.hostId ?? "");
      setDay(room.day ?? 1);
      setLastEliminatedPlayerId(
        room.lastEliminatedPlayerId ?? ""
      );
      setVotes(room.votes ?? {});
      setNightActions(room.nightActions ?? {});
      setAttackedPlayerId(room.attackedPlayerId ?? "");
      setProtectedSuccess(
        room.protectedSuccess ?? false
      );
      setBugKilled(room.bugKilled ?? false);
      setEngineerResults(room.engineerResults ?? {});
      setDoctorResults(room.doctorResults ?? null);
      setWinner(room.winner ?? "");

      const logs = Object.values(
        room.gameLogs ?? {}
      ) as GameLogEntry[];

      setGameLogs(
        logs.sort((a, b) => {
          if (a.day !== b.day) {
            return a.day - b.day;
          }

          return a.id.localeCompare(b.id);
        })
      );

      const votes = Object.values(
        room.voteHistory ?? {}
      ) as VoteHistoryDay[];

      setVoteHistory(
        votes.sort((a, b) => a.day - b.day)
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
  }, [roomCode]);

  const me = players.find(
    (player) => player.id === myPlayerId
  );
  const lastEliminatedPlayer = players.find(
    (player) => player.id === lastEliminatedPlayerId
  );
  const attackedPlayer = players.find(
    (player) => player.id === attackedPlayerId
  );
  const myEngineerResult =
    engineerResults[myPlayerId];
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

  const nextPhase = async () => {
    const currentIndex = phaseOrder.indexOf(phase);

    if (currentIndex === -1) return;

    if (currentIndex >= phaseOrder.length - 1) {
      return;
    }

    const next = phaseOrder[currentIndex + 1];

    await update(ref(db, `rooms/${roomCode}`), {
      phase: next,
      ...(next === "vote" ? { votes: null } : {}),
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

  const finishMorning = async () => {
    await update(ref(db, `rooms/${roomCode}`), {
      phase: "discussion",
    });
  };

  if (!me) {
    return <div className="p-8">読み込み中...</div>;
  }

  const renderPhaseContent = () => {
    switch (phase) {
      case "roleReveal":
        return (
          <div className="border rounded-xl p-6">

            <h2 className="text-2xl font-bold mb-4">
              あなたの役職
            </h2>

            <Image
              src={`/characters/${me.character}.png`}
              alt={me.character ?? ""}
              width={180}
              height={180}
              className="rounded-xl"
            />

            <p className="text-2xl font-bold mt-4">
              {me.name}
            </p>

            <p className="text-3xl text-blue-600 font-bold mt-4">
              {roleNames[me.role ?? ""] ?? "？？？"}
            </p>

          </div>
        );

      case "discussion":
        return (
          <DiscussionPhase
            roomCode={roomCode}
            day={day}
            players={players}
            myPlayer={me}
            isSpectator={isSpectator}
          />
        );

      case "vote":
        return (
          <VotePhase
            players={players}
            myPlayerId={myPlayerId}
            currentVoteTargetId={votes[myPlayerId]}
            errorMessage={voteError}
            isSubmitting={isVoteSubmitting}
            submittedCount={Object.keys(votes).length}
            votePlayer={votePlayer}
          />
        );

      case "sleep":
        return (
          <div className="py-16">
            <h2 className="text-4xl font-bold">
              コールドスリープ
            </h2>

            <p className="mt-6 text-xl text-gray-700">
              全員の投票が終了しました。
            </p>

            <div className="mt-10 rounded-xl border bg-gray-50 p-6">
              <h3 className="text-2xl font-bold mb-5">
                本日のコールドスリープ
              </h3>

              {lastEliminatedPlayer ? (
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
                    width={180}
                    height={180}
                    className="rounded-xl"
                  />

                  <p className="mt-4 text-3xl font-bold">
                    {lastEliminatedPlayer.name}
                  </p>

                  <p className="mt-3 text-lg font-semibold text-red-600">
                    コールドスリープとなりました
                  </p>
                </div>
              ) : (
                <p className="text-gray-600">
                  コールドスリープ対象を読み込み中です。
                </p>
              )}
            </div>

            {myPlayerId === hostId && (
              <div className="mt-8 text-center">
                <button
                  onClick={nextPhase}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700"
                >
                  夕方会議へ進む
                </button>
              </div>
            )}
          </div>
        );

      case "evening":
        if (isSpectator) {
          return (
            <div className="py-16">
              <h2 className="text-4xl font-bold">
                夕方会議
              </h2>

              <p className="mt-6 text-xl text-gray-700">
                あなたは閲覧者モードのため、密談には参加しません。
              </p>

              {lastEliminatedPlayer && (
                <div className="mt-10 rounded-xl border bg-gray-50 p-6">
                  <h3 className="text-2xl font-bold mb-5">
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
                      className="rounded-xl"
                    />

                    <p className="mt-4 text-2xl font-bold">
                      {lastEliminatedPlayer.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        }

        if (!me.chatId) {
          return (
            <div className="text-center py-20">
              <h2 className="text-4xl font-bold">
                夕方会議
              </h2>

              <p className="mt-6 text-xl">
                密談グループを読み込み中です。
              </p>
            </div>
          );
        }

        return (
          <EveningPhase
            roomCode={roomCode}
            myPlayer={me}
            partners={eveningPartners}
            chatId={me.chatId}
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
            myPlayer={me}
            players={players}
            lastEliminatedPlayer={lastEliminatedPlayer}
            alreadyFinished={
              nightActions[myPlayerId]?.finished === true
            }
            onSubmitAction={submitMyNightAction}
          />
        );

      case "morning":
        return (
          <MorningPhase
            attackedPlayer={
              attackedPlayer
                ? {
                    name: attackedPlayer.name,
                    character: attackedPlayer.character,
                  }
                : undefined
            }
            protectedSuccess={protectedSuccess}
            bugKilled={bugKilled}
            engineerResult={
              me.role === "engineer" &&
              myEngineerResult &&
              engineerTarget
                ? {
                    targetName: engineerTarget.name,
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

  return (
    <div className="max-w-5xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-8">
        ゲーム開始
      </h1>

      <div className="border rounded-xl p-5 mb-8 bg-gray-50">
        <h2 className="text-xl font-bold">
          現在のフェーズ
        </h2>

        <p className="text-2xl text-red-600 font-bold mt-2">
          {phaseNames[phase] ?? phase}
        </p>
      </div>

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
