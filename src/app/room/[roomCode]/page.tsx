"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";
import {
  buildRolesFromCounts,
  configurableRoles,
  getDefaultRoleCounts,
  roleLabels,
  type RoleCounts,
} from "@/lib/roles";
import { shuffle } from "@/lib/shuffle";
import {
  clearPlayerSession,
  getPlayerSession,
} from "@/lib/playerSession";
import type { Player } from "@/types/player";

type PlayerWithId = Player & {
  id: string;
};

type RoleCountState = {
  playerCount: number;
  counts: RoleCounts;
};

const countEditableRoles = [
  "crew",
  "gnosia",
];

const singleToggleRoles = [
  "engineer",
  "doctor",
  "guardianAngel",
  "acFollower",
  "bug",
];

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();

  const roomCode = params.roomCode as string;

  const [players, setPlayers] = useState<PlayerWithId[]>([]);
  const [hostId, setHostId] = useState("");
  const [myPlayerId] = useState(() =>
    getPlayerSession().playerId
  );
  const [roleCountState, setRoleCountState] =
    useState<RoleCountState>(() => ({
      playerCount: 0,
      counts: getDefaultRoleCounts(0),
    }));

  useEffect(() => {
    // ルーム情報監視
    const roomRef = ref(db, `rooms/${roomCode}`);

    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      const room = snapshot.val();

      if (!room) return;

      setHostId(room.hostId);

      if (room.status === "playing") {
        router.push(`/game/${roomCode}`);
      }
    });

    // プレイヤー一覧監視
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

  if (roleCountState.playerCount !== players.length) {
    setRoleCountState({
      playerCount: players.length,
      counts: getDefaultRoleCounts(players.length),
    });
  }

  // 自分
  const me = players.find(
    (player) => player.id === myPlayerId
  );

  // 全員準備完了？
  const allReady =
    players.length > 0 &&
    players.every((player) => player.ready);
  const roleCounts = roleCountState.counts;
  const roleTotal = Object.values(roleCounts).reduce(
    (sum, count) => sum + count,
    0
  );
  const roleTotalMatchesPlayers =
    roleTotal === players.length;
  const guardDutyCount =
    roleCounts.guardDuty ?? 0;
  const guardDutyCountIsValid =
    guardDutyCount === 0 || guardDutyCount === 2;
  const singleToggleRolesAreValid =
    singleToggleRoles.every((role) => {
      const count = roleCounts[role] ?? 0;

      return count === 0 || count === 1;
    });
  const roleSettingsAreValid =
    roleTotalMatchesPlayers &&
    guardDutyCountIsValid &&
    singleToggleRolesAreValid;

  const changeRoleCount = (
    role: string,
    value: number
  ) => {
    setRoleCountState((currentState) => ({
      ...currentState,
      counts: {
        ...currentState.counts,
        [role]: Math.max(0, value),
      },
    }));
  };

  const toggleRole = (
    role: string,
    enabledCount: number
  ) => {
    const currentCount = roleCounts[role] ?? 0;

    changeRoleCount(
      role,
      currentCount > 0 ? 0 : enabledCount
    );
  };

  // キャラクター選択
  const goCharacterSelect = () => {
    router.push("/character-select");
  };

  const leaveRoom = async () => {
    if (!myPlayerId) {
      router.push("/");
      return;
    }

    const remainingPlayers = players.filter(
      (player) => player.id !== myPlayerId
    );
    const nextHostId =
      remainingPlayers[0]?.id ?? null;

    const updates: Record<string, unknown> = {};

    if (remainingPlayers.length === 0) {
      updates[`rooms/${roomCode}`] = null;
    } else {
      updates[
        `rooms/${roomCode}/players/${myPlayerId}`
      ] = null;

      if (myPlayerId === hostId) {
        updates[`rooms/${roomCode}/hostId`] =
          nextHostId;
      }
    }

    try {
      await update(ref(db), updates);
      clearPlayerSession();
      router.push("/");
    } catch (error) {
      console.error(error);
      alert("退室に失敗しました");
    }
  };

  // ゲーム開始
  const startGame = async () => {
    try {
      const roles = buildRolesFromCounts(roleCounts);

      if (roles.length !== players.length) {
        alert(
          `役職の合計人数を参加者数（${players.length}人）に合わせてください`
        );
        return;
      }

      if ((roleCounts.gnosia ?? 0) === 0) {
        alert("グノーシアは1人以上必要です");
        return;
      }

      if (!guardDutyCountIsValid) {
        alert("留守番は0人または2人にしてください");
        return;
      }

      if (!singleToggleRolesAreValid) {
        alert(
          "エンジニア、ドクター、守護天使、AC主義者、バグは0人または1人にしてください"
        );
        return;
      }

      // シャッフル
      const shuffledRoles = shuffle(roles);

      // 各プレイヤーへ役職を保存
      for (let i = 0; i < players.length; i++) {
        await update(
          ref(
            db,
            `rooms/${roomCode}/players/${players[i].id}`
          ),
          {
            role: shuffledRoles[i],
            alive: true,
            eliminationReason: null,
            chatId: null,
            eveningFinished: null,
          }
        );
      }

      // ゲーム開始
      await update(ref(db, `rooms/${roomCode}`), {
        status: "playing",
        phase: "roleReveal",
        day: 1,
        roleCounts,
        votes: null,
        voteStage: null,
        runoffCandidateIds: null,
        nightActions: null,
        gnosiaAttackTargetId: null,
        gnosiaChats: null,
        roleRevealChats: null,
        discussionChats: null,
        eveningChats: null,
        lastEliminatedPlayerId: null,
        lastEliminatedPlayerIds: null,
        attackedPlayerId: null,
        protectedSuccess: false,
        bugKilled: false,
        bugKilledIds: null,
        engineerResults: null,
        engineerInvestigationHistory: null,
        doctorResults: null,
        winner: null,
        gameLogs: null,
        voteHistory: null,
      });

      alert("役職を配布しました！");
    } catch (error) {
      console.error(error);
      alert("ゲーム開始に失敗しました");
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#c8e2e6] px-6 py-10 text-[#6f5d4c]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.84)_0%,rgba(204,228,231,0.68)_36%,rgba(132,190,199,0.74)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(70,132,150,0.18)_0%,rgba(255,255,255,0.5)_32%,rgba(255,255,255,0.5)_68%,rgba(73,137,150,0.22)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-2/3 bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.18)_58%,rgba(255,255,255,0)_100%)]" />

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="relative mb-10 text-center">
          <div className="absolute left-0 right-0 top-1/2 h-px bg-[#1e5b8e]/55" />

          <h1 className="relative text-[clamp(2.8rem,8vw,5.5rem)] font-normal italic tracking-[0.18em] text-[#174b84] drop-shadow-[0_0_8px_rgba(255,255,255,0.75)] [font-family:Georgia,Times_New_Roman,serif]">
            ROOM
          </h1>
        </div>

        <div className="mb-8 flex flex-col items-center justify-between gap-4 rounded-sm border border-white/50 bg-white/22 px-6 py-5 shadow-[0_0_36px_rgba(255,255,255,0.24)] backdrop-blur-sm md:flex-row">
          <div>
            <p className="text-sm tracking-[0.28em] text-white/90 drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]">
              ルームコード
            </p>

            <p className="mt-1 text-3xl tracking-[0.16em] text-[#174b84]">
              {roomCode}
            </p>
          </div>

        <button
          onClick={leaveRoom}
          className="px-5 py-2 text-sm tracking-[0.16em] text-[#6f5d4c] transition hover:text-[#264d72]"
        >
          退室して最初に戻る
        </button>
        </div>

      <h2 className="mb-4 text-xl font-light tracking-[0.18em] text-[#174b84]">
        参加者一覧（{players.length}人）
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {players.map((player) => (
          <div
            key={player.id}
            className="flex flex-col items-center rounded-sm border border-white/50 bg-white/24 p-4 text-center shadow-[0_0_22px_rgba(255,255,255,0.18)] backdrop-blur-sm"
          >
            <Image
              src={
                player.character
                  ? `/characters/${player.character}.png`
                  : "/characters/question.png"
              }
              alt={player.character ?? "未選択"}
              width={100}
              height={100}
              className="rounded-sm"
            />

            <p className="mt-3 text-lg tracking-[0.08em] text-[#174b84]">
              {player.name}
            </p>

            <p className="text-sm text-[#6f5d4c]/70">
              {player.character ?? "未選択"}
            </p>

            <p className="mt-2 text-sm tracking-[0.12em]">
              {player.ready
                ? "準備完了"
                : "準備中"}
            </p>
          </div>
        ))}
      </div>

      {myPlayerId === hostId && (
        <div className="mb-8 rounded-sm border border-white/50 bg-white/22 p-5 shadow-[0_0_36px_rgba(255,255,255,0.22)] backdrop-blur-sm">
          <h2 className="mb-2 text-xl font-light tracking-[0.18em] text-[#174b84]">
            役職設定
          </h2>

          <p className="mb-4 text-sm text-[#6f5d4c]/75">
            誰がどの役職になるかはゲーム開始時にランダムで決まります。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {configurableRoles.map((role) => (
              <div
                key={role}
                className="flex items-center justify-between gap-4 rounded-sm border border-white/50 bg-white/20 p-3"
              >
                <span className="font-semibold tracking-[0.08em] text-[#174b84]">
                  {roleLabels[role]}
                </span>

                {countEditableRoles.includes(role) ? (
                  <input
                    type="number"
                    min={0}
                    value={roleCounts[role] ?? 0}
                    onChange={(event) =>
                      changeRoleCount(
                        role,
                        Number(event.target.value)
                      )
                    }
                    className="w-20 rounded-sm border border-[#1e5b8e]/35 bg-white/30 px-3 py-2 text-right text-[#6f5d4c] outline-none focus:border-[#174b84]"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      toggleRole(
                        role,
                        role === "guardDuty" ? 2 : 1
                      )
                    }
                    className={`rounded-sm px-4 py-2 font-semibold tracking-[0.12em] text-white ${
                      (roleCounts[role] ?? 0) > 0
                        ? "bg-[#174b84]/80 hover:bg-[#174b84]"
                        : "bg-[#6f5d4c]/55 hover:bg-[#6f5d4c]/75"
                    }`}
                  >
                    {(roleCounts[role] ?? 0) > 0
                      ? role === "guardDuty"
                        ? "ON（2人）"
                        : "ON"
                      : "OFF"}
                  </button>
                )}
              </div>
            ))}
          </div>

          <p
            className={`mt-4 font-semibold ${
              roleTotalMatchesPlayers
                ? "text-[#174b84]"
                : "text-red-700"
            }`}
          >
            役職合計: {roleTotal} / 参加者: {players.length}
          </p>

          {!guardDutyCountIsValid && (
            <p className="mt-3 font-semibold text-red-600">
              留守番は0人または2人にしてください。
            </p>
          )}

          {!singleToggleRolesAreValid && (
            <p className="mt-3 font-semibold text-red-600">
              エンジニア、ドクター、守護天使、AC主義者、バグは0人または1人にしてください。
            </p>
          )}
        </div>
      )}

      <button
        onClick={goCharacterSelect}
        className="mr-4 px-5 py-3 text-[#6f5d4c] transition hover:text-[#264d72]"
      >
        {me?.ready
          ? "キャラクター変更"
          : "キャラクター選択"}
      </button>

      {myPlayerId === hostId && allReady && (
        <button
          onClick={startGame}
          disabled={!roleSettingsAreValid}
          className="px-5 py-3 text-[#6f5d4c] transition hover:text-[#264d72] disabled:text-[#6f5d4c]/40"
        >
          ゲーム開始
        </button>
      )}

      {!allReady && (
        <p className="mt-4 text-[#6f5d4c]/75">
          全員の準備が完了するまでお待ちください。
        </p>
      )}
      </div>
    </main>
  );
}
