import { NextRequest, NextResponse } from 'next/server';
import { WebClient } from '@slack/web-api';

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN!;
const DAILY_TASKS_CHANNEL = 'C0A3R590PHT';
const BOT_USER_ID = 'U09VAF66W72';

const slackClient = new WebClient(SLACK_BOT_TOKEN);

export async function GET(req: NextRequest) {
  // Vercel Cron認証
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // チャンネルの最新メッセージを取得
    const history = await slackClient.conversations.history({
      channel: DAILY_TASKS_CHANNEL,
      limit: 10,
    });

    if (!history.messages || history.messages.length === 0) {
      return NextResponse.json({ ok: true, message: 'No messages found' });
    }

    // 最新のBotメッセージを探す
    const latestBotMessage = history.messages.find(
      (msg) => msg.user === BOT_USER_ID && !msg.thread_ts
    );

    if (!latestBotMessage || !latestBotMessage.ts) {
      return NextResponse.json({ ok: true, message: 'No bot message found' });
    }

    // そのメッセージのスレッドに返信があるか確認
    const replies = await slackClient.conversations.replies({
      channel: DAILY_TASKS_CHANNEL,
      ts: latestBotMessage.ts,
    });

    // 返信が1件（元メッセージのみ）= 未返信
    if (replies.messages && replies.messages.length <= 1) {
      // 1時間以上経過しているか確認
      const messageTime = parseFloat(latestBotMessage.ts) * 1000;
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      if (now - messageTime > oneHour) {
        // 催促メッセージを送信
        await slackClient.chat.postMessage({
          channel: DAILY_TASKS_CHANNEL,
          thread_ts: latestBotMessage.ts,
          text: 'まだタスクの報告がないようです。\n\n今日の予定はありますか？小さなことでも構いません。',
        });

        return NextResponse.json({ ok: true, message: 'Reminder sent' });
      }
    }

    return NextResponse.json({ ok: true, message: 'No reminder needed' });
  } catch (error) {
    console.error('Error in task reminder:', error);
    return NextResponse.json({ error: 'Failed to check/send reminder' }, { status: 500 });
  }
}
