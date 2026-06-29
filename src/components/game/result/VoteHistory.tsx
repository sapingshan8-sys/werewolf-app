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
      <div className="border border-white/70 bg-white/58 p-6 shadow-[0_8px_24px_rgba(65,113,128,0.14)] backdrop-blur">
        <h2 className="mb-4 text-2xl font-light tracking-[0.16em] text-[#174b84]">
          投票履歴
        </h2>

        <p className="text-[#5f747b]">
          投票履歴はありません。
        </p>
      </div>
    );
  }

  return (
    <section className="border border-white/70 bg-white/58 p-6 shadow-[0_8px_24px_rgba(65,113,128,0.14)] backdrop-blur">

      <h2 className="mb-6 border-b border-white/70 pb-3 text-2xl font-light tracking-[0.16em] text-[#174b84]">
        投票履歴
      </h2>

      <div className="space-y-8">

        {history.map((dayHistory, index) => (

          <div key={`${dayHistory.day}-${index}`}>

            <h3 className="mb-3 text-xl font-semibold text-[#246c9b]">
              {index + 1}回目の投票
            </h3>

            <table className="w-full border-collapse bg-white/34">

              <thead>

                <tr className="bg-[#d8eff8]/68">

                  <th className="border border-white/70 p-2 text-[#174b84]">
                    投票者
                  </th>

                  <th className="border border-white/70 p-2 text-[#174b84]">
                    投票先
                  </th>

                </tr>

              </thead>

              <tbody>

                {dayHistory.votes.map(
                  (vote, index) => (

                    <tr key={index}>

                      <td className="border border-white/70 p-2 text-center">
                        {vote.voterName}
                      </td>

                      <td className="border border-white/70 p-2 text-center">
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

    </section>
  );
}
