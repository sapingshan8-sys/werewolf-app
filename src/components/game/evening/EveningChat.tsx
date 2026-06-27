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
    <div className="border rounded-xl p-6">

      <h2 className="text-2xl font-bold mb-4">
        密談チャット
      </h2>

      {/* チャット一覧 */}
      <div className="border rounded-lg bg-gray-50 h-96 overflow-y-auto p-4">

        {messages.length === 0 ? (
          <p className="text-gray-500">
            まだメッセージはありません。
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className="mb-4"
            >
              <p className="font-bold text-blue-600">
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
  );
}