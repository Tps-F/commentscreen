# CommentScreen - 仕様書

## 概要

プレゼン/LT中に聴衆のコメントをニコニコ動画風にスクリーン上に流すWebアプリケーション。

## 利用フロー

```
[発表者]
  1. CommentScreenを開き「ルーム」を作成
  2. 表示画面URLをプレゼンPCのブラウザで全画面表示（or OBSブラウザソース）
  3. 投稿用URLまたはSlackチャンネル名を聴衆に共有

[聴衆]
  - スマホ/PCからWeb投稿ページにアクセスしてコメント投稿
  - または指定Slackチャンネルにメッセージを投稿

[結果]
  - コメントがリアルタイムにスクリーン上をニコニコ風に流れる
```

## 画面構成

### 1. トップページ (`/`)
- ルーム作成ボタン
- 既存ルームIDで入室

### 2. コメント表示画面 (`/room/:id/screen`)
- **全画面表示**用のページ
- コメントがニコニコ動画風に流れる
- 背景切替: 透過(chromakey用) / 黒背景 / カスタム色
- OBSブラウザソースとして使える（透過時）

### 3. コメント投稿ページ (`/room/:id`)
- テキスト入力フィールド
- コメント色選択（白/赤/緑/青/黄/ピンク/オレンジ）
- コメント位置選択（流れる/上固定/下固定）
- ニックネーム入力（任意）
- 送信ボタン
- スマホでの操作に最適化

### 4. 管理画面 (`/room/:id/admin`)
- ルーム設定
  - コメント速度調整
  - フォントサイズ調整
  - 最大表示行数
  - NGワードフィルター
  - Slack連携設定（チャンネル指定）
- コメント履歴一覧
- 背景モード切替（透過/黒/カスタム色）

## コメント表示仕様（ニコニコ風）

### 流れるコメント
- 画面右端から左端へ水平に流れる
- 複数行にレーンを分けて重ならないようにする
- 流れる速度: 約4〜8秒で画面を横断（設定で調整可能）
- 同時表示上限: 約30コメント

### 上固定コメント
- 画面上部中央に一定時間（3秒）表示
- 上から順に積み重なる

### 下固定コメント
- 画面下部中央に一定時間（3秒）表示
- 下から順に積み重なる

### スタイル
- フォント: 太字ゴシック体（視認性重視）
- テキスト縁取り: 黒い縁取りで背景を問わず読める
- デフォルトフォントサイズ: 36px（管理画面で調整可能）
- コメント色: 白(デフォルト), 赤, 緑, 青, 黄, ピンク, オレンジ

## 技術スタック

### フロントエンド
- **Next.js 14** (App Router)
- **TypeScript**
- **CSS Modules** or **Tailwind CSS**
- コメント描画: **Canvas API** (HTML5 Canvas)
  - DOM操作より高パフォーマンス
  - 大量コメントでもスムーズ

### リアルタイム通信
- **Socket.IO**
  - WebSocket + ポーリングフォールバック
  - ルーム機能が組み込み済み

### バックエンド
- **Next.js Custom Server** (Express)
  - APIルートとSocket.IOを同一サーバーで提供
- Slack Bot連携: **Slack Bolt for JavaScript**

### デプロイ
- **Railway** or **Fly.io**（WebSocket対応が必要なためVercelではなくこちら）
- 注: Vercelはサーバーレスのため持続的WebSocket接続を維持できない

### データ永続化
- **初期段階: インメモリ**（サーバー再起動でリセット）
  - ルーム情報、コメント履歴をメモリに保持
- 将来拡張: SQLite or Redis

## Slack連携仕様

### セットアップ
1. Slack Appを作成（Bot Token Scopes: `channels:history`, `channels:read`）
2. Event Subscriptions で `message.channels` イベントを購読
3. 管理画面で監視対象チャンネルを設定

### 動作
- 指定チャンネルに投稿されたメッセージを自動的にコメントとして流す
- Bot自身の投稿は無視
- ユーザー名をニックネームとして表示
- Slack側のメッセージフォーマット:
  - 通常テキスト → そのまま流れるコメント
  - `/ue テキスト` → 上固定コメント
  - `/shita テキスト` → 下固定コメント
  - `#red テキスト` → 赤色コメント（色タグ対応）

## API設計

### WebSocket Events

```
Client → Server:
  "comment:post" { roomId, text, color?, position?, nickname? }

Server → Client:
  "comment:new"  { id, text, color, position, nickname, timestamp }
  "room:config"  { speed, fontSize, maxLines, bgMode }
```

### REST API

```
POST /api/rooms              → ルーム作成
GET  /api/rooms/:id          → ルーム情報取得
PUT  /api/rooms/:id/config   → ルーム設定更新
POST /api/rooms/:id/comments → コメント投稿（REST経由）
POST /api/slack/events       → Slack Event受信エンドポイント
```

## 非機能要件

- レイテンシ: コメント投稿から表示まで500ms以内
- 同時接続: 100人程度を想定
- モバイル対応: 投稿ページはレスポンシブ
- ブラウザ対応: Chrome, Safari, Firefox の最新版

## 開発フェーズ

### Phase 1: MVP（今回実装）
- [x] コメント表示画面（Canvas描画、ニコニコ風）
- [x] Web UI投稿ページ
- [x] ルーム作成・参加
- [x] Socket.IOリアルタイム通信
- [x] 背景切替（透過/黒）
- [x] 管理画面（基本設定）

### Phase 2: Slack連携
- [ ] Slack Bot設定
- [ ] チャンネルメッセージ→コメント変換
- [ ] Slack固有のフォーマット対応

### Phase 3: 拡張機能
- [ ] NGワードフィルター
- [ ] コメントログ保存・エクスポート
- [ ] カスタムCSS/テーマ
- [ ] 複数ルーム同時運用
