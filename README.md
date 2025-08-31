# 共通テスト地理問題データベース

Next.js + Vercelで構築した地理問題データベースWebアプリケーション

## セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルに以下を設定：

```
GOOGLE_SPREADSHEET_ID=17cxHniOQP2C7QKCV8nqnn3IKEcd1HwWiDgExGb6FfEE
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

### 3. Google Service Accountの設定（本番環境用）

1. [Google Cloud Console](https://console.cloud.google.com)でプロジェクトを作成
2. Google Sheets APIを有効化
3. サービスアカウントを作成し、JSONキーをダウンロード
4. スプレッドシートにサービスアカウントのメールアドレスを共有（閲覧権限）

### 4. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションが起動します。

## Vercelへのデプロイ

### 自動デプロイの設定

1. GitHubにリポジトリを作成
2. Vercelでプロジェクトをインポート
3. 環境変数を設定（GOOGLE_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY）
4. デプロイ完了！

以降はGitHubにpushするだけで自動的にデプロイされます。

## 機能

- 年度別問題検索（2021-2025年）
- 分野タグでのフィルタリング
- キーワード検索
- 問題画像の表示
- 正答の表示/非表示切り替え

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **データソース**: Google Sheets API
- **ホスティング**: Vercel
- **アイコン**: Lucide React