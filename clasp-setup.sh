#!/bin/bash

# clasp (Google Apps Script CLI) を使った自動デプロイスクリプト

echo "📦 Google Apps Script CLI (clasp) をインストール中..."

# Node.js が必要なのでまずチェック
if ! command -v npm &> /dev/null; then
    echo "❌ Node.js/npm が見つかりません"
    echo "Node.js をインストールしてください: https://nodejs.org/"
    exit 1
fi

# clasp をグローバルインストール
npm install -g @google/clasp

echo "✅ clasp インストール完了"

# Google認証
echo "🔐 Google認証を開始します..."
clasp login

echo "📁 新しいGASプロジェクトを作成します..."

# プロジェクトディレクトリを作成
mkdir -p /Users/shun/geography-gas-project
cd /Users/shun/geography-gas-project

# 新しいGASプロジェクトを作成
clasp create --title "共通テスト地理問題データベース" --type webapp

echo "📄 ファイルをコピー中..."

# メインスクリプトをコピー
cp /Users/shun/geography_webapp_gas.js ./Code.js

# HTMLファイルをコピー
cp /Users/shun/index.html ./index.html

echo "⬆️  ファイルをアップロード中..."

# ファイルをプッシュ
clasp push

echo "🚀 Webアプリとしてデプロイ中..."

# Webアプリとしてデプロイ
clasp deploy --description "共通テスト地理問題データベース - 自動デプロイ"

echo "✅ デプロイ完了!"
echo "📊 プロジェクト情報:"
clasp status

echo "🌐 Webアプリを開く:"
clasp open --webapp