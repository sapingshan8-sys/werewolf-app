export type VoteResult = {
  playerId: string;
  voteCount: number;
};

export type PairGroup = string[];

/**
 * 配列をランダムに並び替える（Fisher-Yates）
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [
      result[j],
      result[i],
    ];
  }

  return result;
}

/**
 * 密談グループ生成
 *
 * ルール
 * ・得票数が少ない順
 * ・同票はランダム
 * ・2人組
 * ・奇数なら最後だけ3人組
 */
export function generatePairs(
  voteResults: VoteResult[]
): PairGroup[] {

  // 得票数ごとにグループ化
  const grouped = new Map<number, VoteResult[]>();

  voteResults.forEach((player) => {
    if (!grouped.has(player.voteCount)) {
      grouped.set(player.voteCount, []);
    }

    grouped.get(player.voteCount)!.push(player);
  });

  // 得票数の昇順
  const sortedVotes = [...grouped.keys()].sort(
    (a, b) => a - b
  );

  const orderedPlayers: VoteResult[] = [];

  // 同票はシャッフル
  sortedVotes.forEach((voteCount) => {
    const players = grouped.get(voteCount)!;

    orderedPlayers.push(...shuffle(players));
  });

  const groups: PairGroup[] = [];

  let index = 0;

  while (index < orderedPlayers.length) {

    const remain =
      orderedPlayers.length - index;

    // 残り3人なら3人組
    if (remain === 3) {

      groups.push([
        orderedPlayers[index].playerId,
        orderedPlayers[index + 1].playerId,
        orderedPlayers[index + 2].playerId,
      ]);

      break;
    }

    // 通常2人組
    groups.push([
      orderedPlayers[index].playerId,
      orderedPlayers[index + 1].playerId,
    ]);

    index += 2;
  }

  return groups;
}