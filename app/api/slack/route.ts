import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam, TextBlock } from '@anthropic-ai/sdk/resources/messages';
import { WebClient } from '@slack/web-api';

// 環境変数
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN!;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

// タスク管理用チャンネル
const DAILY_TASKS_CHANNEL = 'C0A3R590PHT';

// Slack Web API Client
const slackClient = new WebClient(SLACK_BOT_TOKEN);

// Anthropic Client
const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

// セッション管理（簡易版 - メモリベース）
// 本番環境ではVercel KVやデータベースを使用すべき
const sessions = new Map<string, { conversationId: string; messages: MessageParam[] }>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const data = JSON.parse(body);

    console.log('Slack webhook received:', JSON.stringify(data).substring(0, 200));

    // Slack URL Verification
    if (data.type === 'url_verification') {
      return NextResponse.json({ challenge: data.challenge });
    }

    // Slack Retry対策
    const retryNum = req.headers.get('x-slack-retry-num');
    if (retryNum) {
      console.log('Slack retry detected, ignoring');
      return NextResponse.json({ ok: true });
    }

    // イベント処理
    if (data.event && data.event.type === 'message' && !data.event.bot_id) {
      const userMessage = data.event.text;
      const channel = data.event.channel;
      const userId = data.event.user;

      // リセットコマンド
      if (userMessage === 'リセット' || userMessage === 'reset') {
        sessions.delete(userId);
        await postToSlack(channel, 'セッションをリセットしました');
        return NextResponse.json({ ok: true });
      }

      // チャンネル別に処理を分岐
      if (channel === DAILY_TASKS_CHANNEL) {
        // タスク管理モード
        const response = await runTaskManager(userMessage, userId);
        await postToSlack(channel, response);
      } else {
        // Claude Code風の応答を生成
        const response = await runClaude(userMessage, userId);
        await postToSlack(channel, response);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error processing Slack webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function runClaude(prompt: string, userId: string): Promise<string> {
  try {
    // セッション取得または作成
    let session = sessions.get(userId);
    if (!session) {
      session = {
        conversationId: `conv_${Date.now()}`,
        messages: [],
      };
      sessions.set(userId, session);
    }

    // メッセージ履歴に追加
    session.messages.push({
      role: 'user',
      content: prompt,
    });

    // 履歴が長すぎる場合は古いものを削除（最新10件まで）
    if (session.messages.length > 20) {
      session.messages = session.messages.slice(-20);
    }

    // Claude APIを呼び出し
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: `あなたはClaude Codeです。ユーザーのプログラミングや技術的な質問に答えるAIアシスタントです。

重要な注意事項：
- ファイル操作やコマンド実行はできません（Slack経由のため）
- コードの説明、アドバイス、デバッグ支援に特化しています
- 簡潔で分かりやすい回答を心がけてください
- 必要に応じてコードブロックを使用してください`,
      messages: session.messages,
    });

    // アシスタントの応答を履歴に追加
    const responseText = message.content
      .filter((block): block is TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    session.messages.push({
      role: 'assistant',
      content: responseText,
    });

    // 長すぎる応答は切り詰め
    if (responseText.length > 3000) {
      return responseText.substring(0, 3000) + '\n\n...(省略)';
    }

    return responseText;
  } catch (error: unknown) {
    console.error('Error calling Claude API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return `エラーが発生しました: ${errorMessage}`;
  }
}

async function postToSlack(channel: string, text: string) {
  try {
    await slackClient.chat.postMessage({
      channel,
      text,
    });
  } catch (error) {
    console.error('Error posting to Slack:', error);
  }
}

// タスク管理用セッション
const taskSessions = new Map<string, { messages: MessageParam[] }>();

async function runTaskManager(prompt: string, userId: string): Promise<string> {
  try {
    let session = taskSessions.get(userId);
    if (!session) {
      session = { messages: [] };
      taskSessions.set(userId, session);
    }

    session.messages.push({
      role: 'user',
      content: prompt,
    });

    if (session.messages.length > 20) {
      session.messages = session.messages.slice(-20);
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `あなたは地理塾の運営をサポートする優しく有能なアシスタントです。

## 地理塾について
- オンライン個人運営の共通テスト地理対策専門塾
- 対象: 主に高校生（特に理系受験生）
- 目標: 生徒の80点以上獲得 / 年商1,000万円（生徒数100人）
- 形式: 集団授業が中心、個別指導は必要に応じて限定募集

## 指導方針
- 地誌の丸暗記より「国のイメージ（GDP・人口・産業など）」形成を重視
- 系統地理に重点
- 初見図表への対応力を実践型で育成
- 得点戦略: 6割完答 + 残り4割を2択に絞る

## 主な業務・チャネル
- SEOブログ記事、YouTube（集客の主軸）
- Google広告（月10万円程度、40〜50代保護者ターゲット）
- LINE（ステップ配信で限定コンテンツ→授業案内）
- 過去問データベースWebアプリ（Next.js + Vercel）

## 課題
- 高3の1月に一斉退塾（季節性）
- 自分が業務を抱えすぎてYouTube・記事投稿が進みにくい

## タスク管理の役割
- ユーザーが挙げたタスクを整理・分解する
- 優先順位付けを手伝う
- 完了確認を行う
- 励ましつつも理性的に対応する

## スタイル
- 丁寧だが簡潔
- 過度に感情的にならない
- 具体的なアクションを提示
- 地理塾の文脈を理解した上でアドバイス

タスクが挙げられたら:
1. タスクを確認し、必要なら分解を提案
2. 優先順位があれば確認
3. 「今日はこれで進めましょう」と締める

完了報告があったら:
1. 確認・承認
2. 次のタスクがあれば確認
3. なければ労いの言葉`,
      messages: session.messages,
    });

    const responseText = message.content
      .filter((block): block is TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    session.messages.push({
      role: 'assistant',
      content: responseText,
    });

    if (responseText.length > 3000) {
      return responseText.substring(0, 3000) + '\n\n...(省略)';
    }

    return responseText;
  } catch (error: unknown) {
    console.error('Error in task manager:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return `エラーが発生しました: ${errorMessage}`;
  }
}
