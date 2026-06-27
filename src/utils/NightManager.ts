import {
  get,
  ref,
  update,
} from "firebase/database";

import { db } from "@/lib/firebase";

import type { Player } from "@/types/player";

type PlayerWithId = Player & {
  id: string;
};

type NightAction = {
  role: string;
  targetId?: string;
  finished?: boolean;
};

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

  //------------------------------------------------
  // 守護対象
  //------------------------------------------------

  let protectedId: string | null = null;

  //------------------------------------------------
  // 襲撃対象
  //------------------------------------------------

  let attackTarget: string | null = null;

  for (const playerId in actions) {
    const action = actions[playerId];

    switch (action.role) {
      case "engineer": {

        const target = players.find(
          (p) => p.id === action.targetId
        );

        engineerResults[playerId] = {
          targetId: action.targetId!,
          isGnosia:
            target?.role === "gnosia",
        };

        break;
      }

      case "guardian": {

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

  if (
    attackTarget &&
    attackTarget !== protectedId
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

  //------------------------------------------------
  // エンジニア結果保存
  //------------------------------------------------

  await update(
    ref(db, `rooms/${roomCode}`),
    {
      engineerResults,
    }
  );

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
      phase: "discussion",
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