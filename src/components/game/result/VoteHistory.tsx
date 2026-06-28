"use client";

type VoteRecord = {
  voterName: string;
  targetName: string;
};

type VoteDay = {
  day: number;
  order?: number;
  votes: VoteRecord[];
};

type Props = {
  history: VoteDay[];
};

export default function VoteHistory({
  history,
}: Props) {
  if (history.length === 0) {
    return (
      <div className="border rounded-xl p-6 mt-8">
        <h2 className="text-2xl font-bold mb-4">
          投票履歴
        </h2>

        <p className="text-gray-500">
          投票履歴はありません。
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-xl p-6 mt-8">

      <h2 className="text-2xl font-bold mb-6">
        投票履歴
      </h2>

      <div className="space-y-8">

        {history.map((dayHistory, index) => (

          <div key={`${dayHistory.day}-${index}`}>

            <h3 className="text-xl font-bold mb-3">
              {index + 1}回目の投票
            </h3>

            <table className="w-full border-collapse">

              <thead>

                <tr className="bg-gray-100">

                  <th className="border p-2">
                    投票者
                  </th>

                  <th className="border p-2">
                    投票先
                  </th>

                </tr>

              </thead>

              <tbody>

                {dayHistory.votes.map(
                  (vote, index) => (

                    <tr key={index}>

                      <td className="border p-2 text-center">
                        {vote.voterName}
                      </td>

                      <td className="border p-2 text-center">
                        {vote.targetName}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        ))}

      </div>

    </div>
  );
}
