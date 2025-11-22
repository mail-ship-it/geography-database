import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { WebClient } from '@slack/web-api';

// 環境変数
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN!;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

// Slack Web API Client
const slackClient = new WebClient(SLACK_BOT_TOKEN);

// Anthropic Client
const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

// セッション管理（簡易版 - メモリベース）
// 本番環境ではVercel KVやデータベースを使用すべき
const sessions = new Map<string, { conversationId: string; messages: any[] }>();

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

      // Claude Code風の応答を生成
      const response = await runClaude(userMessage, userId);
      await postToSlack(channel, response);
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
      messages: session.messages as any,
    });

    // アシスタントの応答を履歴に追加
    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block: any) => block.text)
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
  } catch (error: any) {
    console.error('Error calling Claude API:', error);
    return `エラーが発生しました: ${error.message}`;
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
