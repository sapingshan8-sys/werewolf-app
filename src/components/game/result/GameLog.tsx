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
      <div className="border border-white/70 bg-white/58 p-6 shadow-[0_8px_24px_rgba(65,113,128,0.14)] backdrop-blur">
        <h2 className="mb-4 text-2xl font-light tracking-[0.16em] text-[#174b84]">
          ゲームログ
        </h2>

        <p className="text-[#5f747b]">
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
    <section className="border border-white/70 bg-white/58 p-6 shadow-[0_8px_24px_rgba(65,113,128,0.14)] backdrop-blur">

      <h2 className="mb-6 border-b border-white/70 pb-3 text-2xl font-light tracking-[0.16em] text-[#174b84]">
        ゲームログ
      </h2>

      <div className="space-y-8">

        {Object.entries(groupedLogs).map(
          ([day, dayLogs]) => (

            <div key={day}>

              <h3 className="mb-4 text-xl font-semibold text-[#246c9b]">
                {day}日目
              </h3>

              <div className="space-y-3">

                {dayLogs.map((log) => (

                  <div
                    key={log.id}
                    className="flex gap-6 border-l-4 border-[#7fb4c5] bg-white/34 px-4 py-2"
                  >

                    <div className="w-16 font-mono text-[#6f5d4c]">
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

    </section>
  );
}
