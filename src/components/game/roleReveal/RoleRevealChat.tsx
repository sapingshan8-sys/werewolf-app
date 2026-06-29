"use client";

import { useEffect, useState } from "react";
import {
  onValue,
  push,
  ref,
  set,
} from "firebase/database";
import { db } from "@/lib/firebase";
import ChatInput from "../evening/ChatInput";

type Message = {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  createdAt: number;
};

type Props = {
  roomCode: string;
  chatKey: "gnosia" | "guardDuty";
  myPlayerId: string;
  myName: string;
  title: string;
};

export default function RoleRevealChat({
  roomCode,
  chatKey,
  myPlayerId,
  myName,
  title,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const messagesRef = ref(
      db,
      `rooms/${roomCode}/roleRevealChats/${chatKey}/messages`
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

      list.sort((a, b) => a.createdAt - b.createdAt);
      setMessages(list);
    });

    return () => unsubscribe();
  }, [roomCode, chatKey]);

  const sendMessage = async (text: string) => {
    const trimmedText = text.trim();

    if (trimmedText === "") {
      return;
    }

    setIsSending(true);

    try {
      const messageRef = push(
        ref(
          db,
          `rooms/${roomCode}/roleRevealChats/${chatKey}/messages`
        )
      );

      await set(messageRef, {
        playerId: myPlayerId,
        playerName: myName,
        text: trimmedText,
        createdAt: Date.now(),
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="relative mt-8 border-4 border-white/82 bg-[#727681]/72 text-white shadow-[4px_4px_0_rgba(0,0,0,0.16)]">
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.12)_0px,rgba(255,255,255,0.12)_2px,transparent_2px,transparent_8px)]" />

      <div className="relative z-10 p-6">
        <h3 className="text-2xl font-light tracking-[0.16em]">
          {title}
        </h3>

        <div className="mt-5 h-48 overflow-y-auto bg-white/76 p-4 text-[#2e2c2c] shadow-[0_0_0_3px_rgba(255,255,255,0.68)]">
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

        <ChatInput
          onSend={sendMessage}
          disabled={isSending}
        />
      </div>
    </section>
  );
}
