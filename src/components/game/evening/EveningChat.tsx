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
    <section className="relative min-h-[28rem] p-1 text-white">
      <div className="absolute inset-0 bg-white/88 shadow-[4px_4px_0_rgba(0,0,0,0.22)] [clip-path:polygon(6%_0,100%_0,96%_100%,0_100%,0_14%)]" />
      <div className="absolute inset-[5px] bg-[#727681]/78 [clip-path:polygon(6%_0,100%_0,96%_100%,0_100%,0_14%)]" />
      <div className="absolute inset-[5px] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.12)_0px,rgba(255,255,255,0.12)_2px,transparent_2px,transparent_8px)] [clip-path:polygon(6%_0,100%_0,96%_100%,0_100%,0_14%)]" />

      <div className="relative z-10 p-6">
      <h2 className="mb-4 text-3xl font-light tracking-[0.14em]">
        密談チャット
      </h2>

      {/* チャット一覧 */}
      <div className="h-80 overflow-y-auto bg-white/72 p-5 text-[#2e2c2c] shadow-[0_0_0_3px_rgba(255,255,255,0.65)] [clip-path:polygon(4%_0,100%_0,98%_100%,0_100%,0_14%)]">

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
