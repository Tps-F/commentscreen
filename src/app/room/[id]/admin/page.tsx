"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import type { RoomConfig } from "@/lib/types";

export default function AdminPage() {
  const params = useParams();
  const roomId = params.id as string;
  const socketRef = useRef<Socket | null>(null);
  const [config, setConfig] = useState<RoomConfig>({
    fontSize: 36,
    speed: 5,
    bgMode: "black",
  });
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("room:join", roomId);
      setConnected(true);
    });

    socket.on("room:config", (newConfig: RoomConfig) => {
      setConfig(newConfig);
    });

    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  const updateConfig = (partial: Partial<RoomConfig>) => {
    if (!socketRef.current) return;
    const newConfig = { ...config, ...partial };
    setConfig(newConfig);
    socketRef.current.emit("room:config:update", {
      roomId,
      config: partial,
    });
  };

  const getUrl = (path: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${path}`;
  };

  const copyUrl = async (path: string, label: string) => {
    try {
      await navigator.clipboard.writeText(getUrl(path));
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback: prompt
    }
  };

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Room 設定</h1>
          <p className="text-neutral-400 text-sm">ID: {roomId}</p>
        </div>
        <div
          className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
        />
      </div>

      {/* URLs */}
      <section className="mb-8 space-y-3">
        <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
          共有URL
        </h2>

        <div className="space-y-2">
          <UrlRow
            label="スクリーン表示"
            path={`/room/${roomId}/screen`}
            copied={copied}
            onCopy={copyUrl}
          />
          <UrlRow
            label="コメント投稿"
            path={`/room/${roomId}`}
            copied={copied}
            onCopy={copyUrl}
          />
        </div>
      </section>

      {/* Config */}
      <section className="space-y-6">
        <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
          表示設定
        </h2>

        {/* Speed */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>コメント速度</span>
            <span className="text-neutral-400">{config.speed}</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={config.speed}
            onChange={(e) => updateConfig({ speed: Number(e.target.value) })}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-neutral-500">
            <span>遅い</span>
            <span>速い</span>
          </div>
        </div>

        {/* Font Size */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>フォントサイズ</span>
            <span className="text-neutral-400">{config.fontSize}px</span>
          </div>
          <input
            type="range"
            min={16}
            max={72}
            step={2}
            value={config.fontSize}
            onChange={(e) => updateConfig({ fontSize: Number(e.target.value) })}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-neutral-500">
            <span>16px</span>
            <span>72px</span>
          </div>
        </div>

        {/* Background Mode */}
        <div>
          <span className="text-sm block mb-2">背景モード</span>
          <div className="flex gap-2">
            {[
              { label: "黒", value: "black" },
              { label: "緑", value: "green" },
              { label: "透過", value: "transparent" },
            ].map((bg) => (
              <button
                key={bg.value}
                onClick={() => updateConfig({ bgMode: bg.value })}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  config.bgMode === bg.value
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                }`}
              >
                {bg.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="mt-8 pt-6 border-t border-neutral-800 flex gap-3">
        <a
          href={`/room/${roomId}/screen`}
          target="_blank"
          className="flex-1 text-center py-2 px-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm transition-colors"
        >
          スクリーンを開く
        </a>
        <a
          href={`/room/${roomId}`}
          target="_blank"
          className="flex-1 text-center py-2 px-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm transition-colors"
        >
          投稿ページを開く
        </a>
      </section>
    </div>
  );
}

function UrlRow({
  label,
  path,
  copied,
  onCopy,
}: {
  label: string;
  path: string;
  copied: string | null;
  onCopy: (path: string, label: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-neutral-900 rounded-lg p-3">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-neutral-400">{label}</div>
        <div className="text-sm truncate text-neutral-200">{path}</div>
      </div>
      <button
        onClick={() => onCopy(path, label)}
        className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 rounded text-xs font-medium transition-colors shrink-0 cursor-pointer"
      >
        {copied === label ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
