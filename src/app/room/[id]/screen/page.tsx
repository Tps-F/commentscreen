'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { useCommentCanvas, type CommentData } from '@/hooks/useCommentCanvas';
import type { CommentEvent, RoomConfig } from '@/lib/types';

export default function ScreenPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.id as string;

  const [config, setConfig] = useState<RoomConfig>({
    fontSize: 36,
    speed: 5,
    bgMode: searchParams.get('bg') || 'black',
  });

  const { canvasRef, addComment } = useCommentCanvas(config);
  const addCommentRef = useRef(addComment);
  addCommentRef.current = addComment;

  useEffect(() => {
    const socket: Socket = io();

    socket.on('connect', () => {
      socket.emit('room:join', roomId);
    });

    socket.on('room:config', (newConfig: RoomConfig) => {
      setConfig((prev) => ({ ...prev, ...newConfig }));
    });

    socket.on('comment:new', (comment: CommentEvent) => {
      addCommentRef.current({
        id: comment.id,
        text: comment.text,
        color: comment.color,
        position: comment.position,
      } as CommentData);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  return (
    <div
      className={`screen-page ${config.bgMode === 'transparent' ? 'bg-transparent' : ''}`}
      style={
        config.bgMode !== 'transparent' && config.bgMode !== 'black'
          ? { background: config.bgMode }
          : config.bgMode === 'black'
            ? { background: '#000' }
            : undefined
      }
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          position: 'fixed',
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
}
