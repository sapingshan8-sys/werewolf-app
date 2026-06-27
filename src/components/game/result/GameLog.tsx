"use client";

type Log = {
  id: string;
  day: number;
  time: string;
  message: string;
};

type Props = {
  logs: Log[];
};

export default function GameLog({
  logs,
}: Props) {
  if (logs.length === 0) {
    return (
      <div className="border rounded-xl p-6 mt-8">
        <h2 className="text-2xl font-bold mb-4">
          ゲームログ
        </h2>

        <p className="text-gray-500">
          ログはありません。
        </p>
      </div>
    );
  }

  const groupedLogs = logs.reduce(
    (acc, log) => {
      if (!acc[log.day]) {
        acc[log.day] = [];
      }

      acc[log.day].push(log);

      return acc;
    },
    {} as Record<number, Log[]>
  );

  return (
    <div className="border rounded-xl p-6 mt-8">

      <h2 className="text-2xl font-bold mb-6">
        ゲームログ
      </h2>

      <div className="space-y-8">

        {Object.entries(groupedLogs).map(
          ([day, dayLogs]) => (

            <div key={day}>

              <h3 className="text-xl font-bold mb-4">
                {day}日目
              </h3>

              <div className="space-y-3">

                {dayLogs.map((log) => (

                  <div
                    key={log.id}
                    className="flex gap-6 border-l-4 border-blue-500 pl-4"
                  >

                    <div className="font-mono text-gray-500 w-16">
                      {log.time}
                    </div>

                    <div>
                      {log.message}
                    </div>

                  </div>

                ))}

              </div>

            </div>

          )
        )}

      </div>

    </div>
  );
}