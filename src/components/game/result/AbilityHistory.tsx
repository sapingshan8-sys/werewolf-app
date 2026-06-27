"use client";

type AbilityRecord = {
  playerName: string;
  role: string;
  targetName: string;
  result?: string;
};

type AbilityDay = {
  day: number;
  actions: AbilityRecord[];
};

type Props = {
  history: AbilityDay[];
};

const roleNames: Record<string, string> = {
  engineer: "エンジニア",
  doctor: "ドクター",
  guardianAngel: "守護天使",
  gnosia: "グノーシア",
};

export default function AbilityHistory({
  history,
}: Props) {
  if (history.length === 0) {
    return (
      <div className="border rounded-xl p-6 mt-8">
        <h2 className="text-2xl font-bold mb-4">
          能力使用履歴
        </h2>

        <p className="text-gray-500">
          能力使用履歴はありません。
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-xl p-6 mt-8">

      <h2 className="text-2xl font-bold mb-6">
        能力使用履歴
      </h2>

      <div className="space-y-8">

        {history.map((dayHistory) => (

          <div key={dayHistory.day}>

            <h3 className="text-xl font-bold mb-4">
              {dayHistory.day}日目
            </h3>

            <table className="w-full border-collapse">

              <thead>

                <tr className="bg-gray-100">

                  <th className="border p-2">
                    使用者
                  </th>

                  <th className="border p-2">
                    役職
                  </th>

                  <th className="border p-2">
                    対象
                  </th>

                  <th className="border p-2">
                    結果
                  </th>

                </tr>

              </thead>

              <tbody>

                {dayHistory.actions.map(
                  (action, index) => (

                    <tr key={index}>

                      <td className="border p-2 text-center">
                        {action.playerName}
                      </td>

                      <td className="border p-2 text-center">
                        {roleNames[action.role] ??
                          action.role}
                      </td>

                      <td className="border p-2 text-center">
                        {action.targetName}
                      </td>

                      <td className="border p-2 text-center">
                        {action.result ?? "-"}
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