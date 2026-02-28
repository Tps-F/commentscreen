import { createServer } from 'http';
import next from 'next';
import { Server } from 'socket.io';
import { parse } from 'url';
import { v4 as uuidv4 } from 'uuid';
import type { RoomConfig, CommentPayload } from './src/lib/types';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

interface Room {
  id: string;
  config: RoomConfig;
  createdAt: number;
}

const rooms = new Map<string, Room>();

const DEFAULT_CONFIG: RoomConfig = {
  fontSize: 36,
  speed: 5,
  bgMode: 'black',
};

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    console.log('Connected:', socket.id);

    socket.on('room:join', (roomId: string) => {
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          id: roomId,
          config: { ...DEFAULT_CONFIG },
          createdAt: Date.now(),
        });
      }
      socket.join(roomId);
      const room = rooms.get(roomId)!;
      socket.emit('room:config', room.config);
    });

    socket.on('comment:post', (data: CommentPayload) => {
      if (!data.text || !data.text.trim() || !data.roomId) return;

      const comment = {
        id: uuidv4(),
        text: data.text.trim(),
        color: data.color || '#FFFFFF',
        position: data.position || 'flow',
        nickname: data.nickname || '',
        timestamp: Date.now(),
      };
      io.to(data.roomId).emit('comment:new', comment);
    });

    socket.on('room:config:update', (data: { roomId: string; config: Partial<RoomConfig> }) => {
      const room = rooms.get(data.roomId);
      if (room) {
        Object.assign(room.config, data.config);
        io.to(data.roomId).emit('room:config', room.config);
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected:', socket.id);
    });
  });

  const port = parseInt(process.env.PORT || '3000', 10);
  httpServer.listen(port, () => {
    console.log(`> CommentScreen ready on http://localhost:${port}`);
  });
});
