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
    <div className="flex gap-3 mt-4">

      <input
        type="text"
        value={message}
        disabled={disabled}
        placeholder="メッセージを入力..."
        className="flex-1 border rounded-lg px-3 py-2"
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
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-5 rounded-lg transition"
      >
        送信
      </button>

    </div>
  );
}