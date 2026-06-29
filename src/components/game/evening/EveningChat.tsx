"use client";

import { useEffect, useState } from "react";
import {
  ref,
  onValue,
  push,
  set,
} from "firebase/database";
import { db } from "@/lib/firebase";
import ChatInput from "./ChatInput";

type Message = {
  id: string;
  playerName: string;
  text: string;
  createdAt: number;
};

type Props = {
  roomCode: string;
  chatId: string;
  myName: string;
};

export default function EveningChat({
  roomCode,
  chatId,
  myName,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);

  // メッセージを監視
  useEffect(() => {
    const messagesRef = ref(
      db,
      `rooms/${roomCode}/eveningChats/${chatId}/messages`
    );

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setMessages([]);
        return;
      }

      const list: Message[] = Object.entries(data).map(
        ([id, value]) => ({
          id,
          ...(value as Omit<Message, "id">),
        })
      );

      list.sort(
        (a, b) => a.createdAt - b.createdAt
      );

      setMessages(list);
    });

    return () => unsubscribe();
  }, [roomCode, chatId]);

  // メッセージ送信
  const sendMessage = async (
    text: string
  ) => {
    if (text.trim() === "") return;

    const messageRef = push(
      ref(
        db,
        `rooms/${roomCode}/eveningChats/${chatId}/messages`
      )
    );

    await set(messageRef, {
      playerName: myName,
      text,
      createdAt: Date.now(),
    });
  };

  return (
    <section className="relative min-h-[28rem] overflow-hidden border border-white/70 bg-white/62 text-[#2e2c2c] shadow-[0_0_0_3px_rgba(255,255,255,0.55),0_18px_40px_rgba(69,117,132,0.18)] backdrop-blur">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(199,232,240,0.28)_52%,rgba(255,255,255,0.45)),repeating-linear-gradient(0deg,rgba(113,158,170,0.08)_0px,rgba(113,158,170,0.08)_1px,transparent_1px,transparent_8px)]" />

      <div className="relative z-10 p-6">
      <h2 className="mb-4 border-b border-[#7aa8b8]/35 pb-3 text-3xl font-light tracking-[0.14em] text-[#2f6d90]">
        密談チャット
      </h2>

      {/* チャット一覧 */}
      <div className="h-80 overflow-y-auto border border-white/75 bg-white/66 p-5 text-[#2e2c2c] shadow-[inset_0_0_24px_rgba(129,177,188,0.16)]">

        {messages.length === 0 ? (
          <p className="text-[#666]">
            まだメッセージはありません。
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className="mb-4"
            >
              <p className="font-bold text-[#2870a4]">
                {message.playerName}
              </p>

              <p className="ml-3 break-words">
                {message.text}
              </p>
            </div>
          ))
        )}

      </div>

      {/* 入力欄 */}
      <ChatInput
        onSend={sendMessage}
      />

      </div>
    </section>
  );
}
