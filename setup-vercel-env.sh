#!/bin/bash
# Vercel環境変数設定スクリプト

echo "Vercel環境変数設定スクリプト"
echo "================================"
echo ""
echo "このスクリプトは以下の環境変数をVercelに設定します："
echo "- SLACK_BOT_TOKEN"
echo "- SLACK_SIGNING_SECRET"
echo "- LINE_CHANNEL_ACCESS_TOKEN"
echo "- LINE_CHANNEL_SECRET"
echo "- ANTHROPIC_API_KEY"
echo ""

# Vercelプロジェクト確認
echo "Vercelプロジェクトを確認中..."
vercel link 2>/dev/null || {
    echo "Vercelプロジェクトにリンクしていません。"
    echo "vercel link を実行してください。"
    exit 1
}

echo ""
echo "環境変数を設定しています..."
echo ""

# .env.localから読み込み
if [ ! -f .env.local ]; then
    echo "エラー: .env.localが見つかりません"
    exit 1
fi

# 環境変数を抽出して設定
source .env.local

# Slack設定
echo "1/5 SLACK_BOT_TOKEN を設定中..."
echo "$SLACK_BOT_TOKEN" | vercel env add SLACK_BOT_TOKEN production

echo "2/5 SLACK_SIGNING_SECRET を設定中..."
echo "$SLACK_SIGNING_SECRET" | vercel env add SLACK_SIGNING_SECRET production

# LINE設定
echo "3/5 LINE_CHANNEL_ACCESS_TOKEN を設定中..."
echo "$LINE_CHANNEL_ACCESS_TOKEN" | vercel env add LINE_CHANNEL_ACCESS_TOKEN production

echo "4/5 LINE_CHANNEL_SECRET を設定中..."
echo "$LINE_CHANNEL_SECRET" | vercel env add LINE_CHANNEL_SECRET production

# Anthropic設定
if [ "$ANTHROPIC_API_KEY" != "YOUR_ANTHROPIC_API_KEY" ]; then
    echo "5/5 ANTHROPIC_API_KEY を設定中..."
    echo "$ANTHROPIC_API_KEY" | vercel env add ANTHROPIC_API_KEY production
else
    echo "⚠ ANTHROPIC_API_KEY がまだ設定されていません"
    echo "   .env.localを編集してから再実行してください"
fi

echo ""
echo "================================"
echo "✓ 環境変数の設定が完了しました"
echo ""
echo "次のステップ:"
echo "1. vercel --prod でデプロイ"
echo "2. Slack Webhook URLを更新"
echo ""
