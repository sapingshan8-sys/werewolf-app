"use client";

import { useState } from "react";

type Props = {
  onSend: (message: string) => Promise<void> | void;
  disabled?: boolean;
};

export default function ChatInput({
  onSend,
  disabled = false,
}: Props) {
  const [message, setMessage] = useState("");

  const send = async () => {
    const text = message.trim();

    if (text === "") return;

    await onSend(text);

    setMessage("");
  };

  return (
    <div className="mt-5 flex gap-3">

      <input
        type="text"
        value={message}
        disabled={disabled}
        placeholder="メッセージを入力..."
        className="min-w-0 flex-1 border-[3px] border-black bg-white px-4 py-3 text-lg text-[#666] outline-none placeholder:text-[#777]"
        onChange={(e) =>
          setMessage(e.target.value)
        }
        onKeyDown={async (e) => {
          if (e.key === "Enter") {
            await send();
          }
        }}
      />

      <button
        onClick={send}
        disabled={disabled}
        className="border-[3px] border-black bg-white px-6 py-3 text-lg text-[#666] transition hover:bg-gray-100 disabled:text-gray-300"
      >
        送信
      </button>

    </div>
  );
}
