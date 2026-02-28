'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function generateRoomId(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export default function TopPage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');

  const handleCreate = () => {
    const id = generateRoomId();
    router.push(`/room/${id}/admin`);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      router.push(`/room/${roomId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">CommentScreen</h1>
          <p className="mt-2 text-neutral-400">
            ニコニコ風コメントをスクリーンに流そう
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-lg transition-colors cursor-pointer"
        >
          ルームを作成
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-[var(--background)] text-neutral-500">
              または
            </span>
          </div>
        </div>

        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="ルームIDを入力"
            className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!roomId.trim()}
            className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors cursor-pointer"
          >
            参加
          </button>
        </form>
      </div>
    </div>
  );
}
