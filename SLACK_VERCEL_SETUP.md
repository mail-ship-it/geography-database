# Slack + Vercel連携セットアップガイド

ngrokからVercelへの移行手順

## 概要

現在ngrok + Node.jsサーバーで動いているSlack/LINEボットを、Vercelのサーバーレス関数に移行します。

### 主な変更点

| 項目 | ngrok版 | Vercel版 |
|------|---------|----------|
| サーバー | 常時起動 (Node.js) | サーバーレス関数 |
| Claude実行 | CLI (`spawn('claude')`) | Anthropic API直接呼び出し |
| セッション管理 | ローカルファイル | メモリベース（後でVercel KV） |
| URL | ngrok動的URL | Vercel固定URL |

## 必要な準備

### 1. Anthropic API キーの取得

1. https://console.anthropic.com にアクセス
2. Sign Up / Log In
3. API Keys セクションで「Create Key」
4. キーをコピー（後で使用）

### 2. Slack Signing Secretの取得

1. https://api.slack.com/apps にアクセス
2. 使用中のSlackアプリを選択
3. 左メニュー「Basic Information」をクリック
4. 「App Credentials」セクションの「Signing Secret」をコピー

## 環境変数の設定

### ローカル環境（`.env.local`）

以下の値を設定してください：

```bash
# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Slack Configuration
SLACK_BOT_TOKEN=xoxb-YOUR-SLACK-BOT-TOKEN
SLACK_SIGNING_SECRET=YOUR_SLACK_SIGNING_SECRET

# LINE Configuration
LINE_CHANNEL_ACCESS_TOKEN=YOUR_LINE_CHANNEL_ACCESS_TOKEN
LINE_CHANNEL_SECRET=YOUR_LINE_CHANNEL_SECRET
```

### Vercel環境変数

Vercelダッシュボードで設定：

1. Vercelプロジェクトを開く
2. Settings → Environment Variables
3. 以下の変数を追加：
   - `ANTHROPIC_API_KEY`
   - `SLACK_BOT_TOKEN`
   - `SLACK_SIGNING_SECRET`
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - `LINE_CHANNEL_SECRET`
   - `GOOGLE_SERVICE_ACCOUNT_KEY` (既存)

## ローカルでテスト

```bash
cd /Users/shun/geography-db

# 開発サーバー起動
npm run dev

# 別ターミナルでngrokでトンネリング（テスト用）
ngrok http 3000
```

### テストエンドポイント

- Slack Webhook: `http://localhost:3000/api/slack`
- LINE Webhook: `http://localhost:3000/api/line`

## Vercelへデプロイ

### 方法1: GitHubプッシュで自動デプロイ

```bash
git add .
git commit -m "Add Slack/LINE API routes for Vercel"
git push origin main
```

### 方法2: Vercel CLIで直接デプロイ

```bash
# ログイン
vercel login

# デプロイ
vercel --prod
```

## Slack Webhook URLの更新

デプロイ後、Vercel URLを取得して Slack設定を更新：

1. Vercelダッシュボードで本番URLを確認（例: `https://geography-database.vercel.app`）
2. https://api.slack.com/apps でSlackアプリを開く
3. 左メニュー「Event Subscriptions」をクリック
4. Request URLを更新:
   ```
   https://geography-database.vercel.app/api/slack
   ```
5. 「Save Changes」

## LINE Webhook URLの更新

1. LINE Developersコンソールを開く
2. Webhook URLを更新:
   ```
   https://geography-database.vercel.app/api/line
   ```

## APIエンドポイント仕様

### `/api/slack` (POST)

**機能:**
- Slack Events APIのwebhookを受信
- Claude APIでメッセージに返信
- セッション管理（ユーザーごとの会話履歴）

**対応コマンド:**
- `リセット` or `reset`: セッションをリセット
- その他: Claude APIで応答生成

### `/api/line` (POST)

**機能:**
- LINE Messaging APIのwebhookを受信
- 地理教育特化のClaude応答
- セッション管理

**対応コマンド:**
- `リセット` or `reset`: セッションをリセット
- その他: 地理教育ボットとして応答

## トラブルシューティング

### Slackで応答がない

1. Vercelのログを確認:
   ```bash
   vercel logs
   ```

2. 環境変数が正しく設定されているか確認

3. Slack Request URLが「Verified」になっているか確認

### LINEで応答がない

1. LINE Developersコンソールでエラーログ確認
2. Webhook URLが正しいか確認
3. 署名検証エラーでないか確認

### セッションが保持されない

現在はメモリベースなので、サーバーレス関数の再起動でリセットされます。
永続化にはVercel KVまたはデータベースが必要です（次のステップ）。

## 次のステップ（オプション）

### セッション永続化（Vercel KV）

```bash
# Vercel KVを有効化
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN

# コード更新（セッションをKVに保存）
```

### Claude Code風のツール実行

Anthropic APIの「Tool Use」機能を使って、ファイル読み取りやコード実行風の応答を実現できます。

## 移行チェックリスト

- [ ] Anthropic API キー取得
- [ ] Slack Signing Secret取得
- [ ] `.env.local` に環境変数設定
- [ ] ローカルでテスト
- [ ] Vercelにデプロイ
- [ ] Vercel環境変数設定
- [ ] Slack Webhook URL更新
- [ ] LINE Webhook URL更新
- [ ] Slackでテストメッセージ送信
- [ ] LINEでテストメッセージ送信
- [ ] ngrokサーバー停止（移行完了後）

## 関連ファイル

- `/app/api/slack/route.ts` - Slack webhook処理
- `/app/api/line/route.ts` - LINE webhook処理
- `/.env.local` - ローカル環境変数
- `/Users/shun/slack-email-notify/server.js` - 旧ngrok版（参考用）

## 参考リンク

- Anthropic API: https://docs.anthropic.com/
- Slack API: https://api.slack.com/
- LINE Messaging API: https://developers.line.biz/
- Vercel Docs: https://vercel.com/docs
