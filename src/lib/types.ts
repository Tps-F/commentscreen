export interface RoomConfig {
  fontSize: number;
  speed: number;      // 1-10
  bgMode: string;     // 'transparent' | 'black' | hex color
}

export interface CommentPayload {
  roomId: string;
  text: string;
  color: string;
  position: 'flow' | 'top' | 'bottom';
  nickname: string;
}

export interface CommentEvent {
  id: string;
  text: string;
  color: string;
  position: 'flow' | 'top' | 'bottom';
  nickname: string;
  timestamp: number;
}

export const DEFAULT_CONFIG: RoomConfig = {
  fontSize: 36,
  speed: 5,
  bgMode: 'black',
};

export const COLORS = [
  { label: '白', value: '#FFFFFF' },
  { label: '赤', value: '#FF0000' },
  { label: '緑', value: '#00FF00' },
  { label: '青', value: '#00BFFF' },
  { label: '黄', value: '#FFFF00' },
  { label: 'ピンク', value: '#FF69B4' },
  { label: 'オレンジ', value: '#FF8C00' },
] as const;

export const POSITIONS = [
  { label: '流れる', value: 'flow' as const },
  { label: '上固定', value: 'top' as const },
  { label: '下固定', value: 'bottom' as const },
] as const;
