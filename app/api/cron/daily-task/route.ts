import { NextRequest, NextResponse } from 'next/server';
import { WebClient } from '@slack/web-api';

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN!;
const DAILY_TASKS_CHANNEL = 'C0A3R590PHT';

const slackClient = new WebClient(SLACK_BOT_TOKEN);

export async function GET(req: NextRequest) {
  // Vercel Cron認証
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await slackClient.chat.postMessage({
      channel: DAILY_TASKS_CHANNEL,
      text: 'おはようございます。\n\n今日のタスクを確認しましょう。\n現時点で予定している作業があれば教えてください。優先順位の整理や分解が必要であればサポートします。',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending daily task message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
