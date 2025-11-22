import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';

// 環境変数
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

// Anthropic Client
const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

// セッション管理（簡易版 - メモリベース）
const sessions = new Map<string, { conversationId: string; messages: any[] }>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-line-signature');

    // 署名検証
    if (!verifyLineSignature(body, signature)) {
      console.log('Invalid LINE signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);
    console.log('LINE webhook received:', JSON.stringify(data));

    // イベント処理
    for (const event of data.events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userMessage = event.message.text;
        const replyToken = event.replyToken;
        const userId = event.source.userId;

        console.log('Processing LINE message:', userMessage);

        // リセットコマンド
        if (userMessage === 'リセット' || userMessage === 'reset') {
          sessions.delete(userId);
          await replyToLine(replyToken, 'セッションをリセットしました');
          continue;
        }

        // Claude応答を生成（地理教育ボット向け）
        const response = await runClaudeForLine(userMessage, userId);
        console.log('Sending LINE response:', response.substring(0, 100));
        await replyToLine(replyToken, response);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error processing LINE webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function verifyLineSignature(body: string, signature: string | null): boolean {
  if (!signature) return false;

  const hash = crypto
    .createHmac('SHA256', LINE_CHANNEL_SECRET)
    .update(body)
    .digest('base64');

  return hash === signature;
}

async function runClaudeForLine(prompt: string, userId: string): Promise<string> {
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

    // Claude APIを呼び出し（地理教育特化）
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: `あなたは高校地理を学ぶ生徒をサポートする親しみやすい地理の先生です。

指導方針：
- 生徒の質問に対して、まず考えさせるような問いかけをする
- 図表の読み取り方を丁寧に教える
- 地理的な因果関係（自然条件×人間活動）を重視する
- 共通テスト対策を意識した説明をする
- 絵文字や親しみやすい言葉遣いで、分かりやすく説明する

対話スタイル：
- 一度に答えを与えず、段階的に理解を深める
- 「なぜそう思う？」「どこに注目した？」など問いかける
- 正解を褒め、間違いは丁寧に訂正する
- 関連する知識も補足する`,
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

    // LINEは5000文字制限
    if (responseText.length > 4500) {
      return responseText.substring(0, 4500) + '\n\n...(続きは次のメッセージで)';
    }

    return responseText;
  } catch (error: any) {
    console.error('Error calling Claude API for LINE:', error);
    return `エラーが発生しました: ${error.message}`;
  }
}

async function replyToLine(replyToken: string, text: string) {
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: 'text', text: text.substring(0, 5000) }],
      }),
    });

    if (!response.ok) {
      console.error('LINE API error:', await response.text());
    }
  } catch (error) {
    console.error('Error replying to LINE:', error);
  }
}
