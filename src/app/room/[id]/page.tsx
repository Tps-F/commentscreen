"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { COLORS, POSITIONS } from "@/lib/types";

export default function PostPage() {
  const params = useParams();
  const roomId = params.id as string;
  const socketRef = useRef<Socket | null>(null);
  const [text, setText] = useState("");
  const [color, setColor] = useState<string>(COLORS[0].value);
  const [position, setPosition] = useState<"flow" | "top" | "bottom">("flow");
  const [nickname, setNickname] = useState("");
  const [connected, setConnected] = useState(false);
  const [lastSentAt, setLastSentAt] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("room:join", roomId);
      setConnected(true);
    });

    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  const handleSend = () => {
    if (!text.trim() || !socketRef.current) return;

    // Rate limit: 1 comment per 500ms
    const now = Date.now();
    if (now - lastSentAt < 500) return;

    socketRef.current.emit("comment:post", {
      roomId,
      text: text.trim(),
      color,
      position,
      nickname: nickname.trim(),
    });

    setText("");
    setLastSentAt(now);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">CommentScreen</h1>
          <span className="text-sm text-neutral-400">Room: {roomId}</span>
        </div>
        <div
          className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
          title={connected ? "接続中" : "切断"}
        />
      </header>

      {/* Form */}
      <div className="flex-1 flex flex-col justify-end p-4 gap-4 max-w-lg mx-auto w-full">
        {/* Nickname */}
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="ニックネーム（任意）"
          className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-blue-500"
        />

        {/* Color picker */}
        <div>
          <label className="text-xs text-neutral-400 mb-1 block">
            コメント色
          </label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={`w-9 h-9 rounded-full border-2 transition-all cursor-pointer ${
                  color === c.value
                    ? "border-white scale-110"
                    : "border-neutral-600"
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* Position picker */}
        <div>
          <label className="text-xs text-neutral-400 mb-1 block">
            表示位置
          </label>
          <div className="flex gap-2">
            {POSITIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPosition(p.value)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  position === p.value
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text input + send */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="コメントを入力..."
            className="flex-1 min-w-0 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 text-base"
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || !connected}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors cursor-pointer"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
