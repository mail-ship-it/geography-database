import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam, TextBlock } from '@anthropic-ai/sdk/resources/messages';
import crypto from 'crypto';
import { getGoogleSheetsClient, SPREADSHEET_ID, type Question, parseTags } from '@/lib/googleSheets';
import fs from 'fs';
import path from 'path';

// 環境変数
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

// Anthropic Client
const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

// セッション管理（簡易版 - メモリベース）
interface StudentProfile {
  grade?: string; // 学年（例: 高1, 高2, 高3）
  targetScore?: number; // 目標点
  currentScore?: number; // 現在の実力
  weakAreas?: string[]; // 苦手分野
}

interface Session {
  conversationId: string;
  messages: MessageParam[];
  profile: StudentProfile;
}

const sessions = new Map<string, Session>();

export async function POST(req: NextRequest) {
  // ===== LINEボット ON/OFF スイッチ =====
  // ボットを止めたい場合は下の行のコメントを外す
  // return NextResponse.json({ ok: true });
  // =====================================

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

        // プロフィール表示コマンド
        if (userMessage === 'プロフィール' || userMessage === 'profile') {
          const session = sessions.get(userId);
          if (session && Object.keys(session.profile).length > 0) {
            let profileText = '📝 あなたのプロフィール\n\n';
            if (session.profile.grade) profileText += `学年: ${session.profile.grade}\n`;
            if (session.profile.targetScore) profileText += `目標点: ${session.profile.targetScore}点\n`;
            if (session.profile.currentScore) profileText += `現在の実力: ${session.profile.currentScore}点\n`;
            if (session.profile.weakAreas && session.profile.weakAreas.length > 0) {
              profileText += `苦手分野: ${session.profile.weakAreas.join('、')}\n`;
            }
            await replyToLine(replyToken, profileText);
          } else {
            await replyToLine(replyToken, 'まだプロフィールが設定されていません。\n「私は高3です」「目標は80点」などと話しかけてくださいね！');
          }
          continue;
        }

        // 問題検索コマンド（例: 「2025年第1問」「気候の問題」）
        const yearQuestionMatch = userMessage.match(/(\d{4})年.*第?(\d+)問/);
        if (yearQuestionMatch) {
          const year = yearQuestionMatch[1];
          const questionNum = parseInt(yearQuestionMatch[2]);
          const question = await getQuestionFromSheets(year, '本試験', questionNum);

          if (question) {
            let questionInfo = `📚 ${year}年本試験 第${questionNum}問\n\n`;
            questionInfo += `分野: ${question.mainTags.join('、')}\n`;
            if (question.subTags.length > 0) {
              questionInfo += `タグ: ${question.subTags.join('、')}\n`;
            }
            questionInfo += `難易度: ${question.difficulty}\n`;
            questionInfo += `正答率: ${question.correctRate}\n`;
            if (question.imageUrl) {
              questionInfo += `\n画像: ${question.imageUrl}\n`;
            }
            questionInfo += `\n正答: ${question.answer}\n`;
            if (question.notes) {
              questionInfo += `\nメモ: ${question.notes}`;
            }
            await replyToLine(replyToken, questionInfo);
            continue;
          }
        }

        // 分野検索コマンド（例: 「気候の問題」）
        const categoryMatch = userMessage.match(/(.+)の問題/);
        if (categoryMatch) {
          const category = categoryMatch[1];
          const questions = await searchQuestionsByCategory(category);

          if (questions.length > 0) {
            let searchResult = `🔍 「${category}」に関する問題（最新${questions.length}件）\n\n`;
            questions.forEach((q) => {
              searchResult += `・${q.year}年 第${q.questionId}問（難易度${q.difficulty}）\n`;
              searchResult += `  ${q.mainTags.join('、')}\n`;
            });
            searchResult += `\n気になる問題があれば「${questions[0].year}年第${questions[0].questionId}問」のように聞いてね！`;
            await replyToLine(replyToken, searchResult);
            continue;
          }
        }

        // 国データ検索コマンド（例: 「ノルウェーのデータ」「ブラジルについて」）
        const countryMatch = userMessage.match(/(.+?)(のデータ|について|とは|って何|データ)/);
        if (countryMatch) {
          const countryName = countryMatch[1].trim();
          const countryData = await getCountryData(countryName);

          if (countryData) {
            let countryInfo = `🌍 ${countryData.country_ja}（${countryData.region}）\n\n`;
            countryInfo += `💰 1人あたりGDP: ${countryData.gdp_per_capita_level}（約$${countryData.gdp_per_capita_estimate}）\n`;
            countryInfo += `👥 人口規模: ${countryData.population_level}（約${countryData.population_estimate}万人）\n`;
            countryInfo += `🌡️ 気候: ${countryData.main_climate}\n`;
            countryInfo += `🏭 主要産業: ${countryData.key_industries_resources}\n`;
            countryInfo += `🔑 キーワード: ${countryData.geo_keywords}\n`;
            if (countryData.exam_story) {
              countryInfo += `\n📝 試験ポイント:\n${countryData.exam_story}`;
            }
            await replyToLine(replyToken, countryInfo);
            continue;
          }
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

// 時期判定関数
function getStudyPeriod(): { month: number; period: string; periodDetail: string; daysToExam: number } {
  const now = new Date();
  // JST変換
  const jst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const month = jst.getMonth() + 1; // 0-indexed → 1-indexed
  const day = jst.getDate();

  // 共通テスト日（1月第3土曜日付近、仮に1月18日として計算）
  const currentYear = jst.getFullYear();
  const examYear = month >= 2 ? currentYear + 1 : currentYear;
  const examDate = new Date(examYear, 0, 18); // 1月18日
  const daysToExam = Math.ceil((examDate.getTime() - jst.getTime()) / (1000 * 60 * 60 * 24));

  let period: string;
  let periodDetail: string;

  if (month >= 4 && month <= 6) {
    period = '春期';
    periodDetail = '新学年スタート期。基礎固めと学習習慣の確立が重要。';
  } else if (month >= 7 && month <= 8) {
    period = '夏期';
    periodDetail = '夏休み集中学習期。系統地理の総復習と弱点克服のチャンス。';
  } else if (month >= 9 && month <= 10) {
    period = '秋期';
    periodDetail = '模試シーズン。実戦演習と時間配分の練習が必要。';
  } else if (month >= 11 && month <= 12) {
    period = '直前準備期';
    periodDetail = '過去問演習と知識の総整理。新しい範囲には手を出さない。';
  } else if (month === 1 && day <= 20) {
    period = '直前期';
    periodDetail = '共通テスト直前。体調管理最優先。確認程度の復習のみ。';
  } else if (month === 1) {
    period = '試験終了後';
    periodDetail = '共通テスト終了。二次試験対策または来年度に向けた振り返り。';
  } else {
    period = '新年度準備期';
    periodDetail = '2-3月。次の受験に向けた準備期間。';
  }

  return { month, period, periodDetail, daysToExam };
}

async function runClaudeForLine(prompt: string, userId: string): Promise<string> {
  try {
    // セッション取得または作成
    let session = sessions.get(userId);
    if (!session) {
      session = {
        conversationId: `conv_${Date.now()}`,
        messages: [],
        profile: {},
      };
      sessions.set(userId, session);
    }

    // RAG: 関連する過去問を検索
    const relatedQuestions = await searchQuestionsForRAG(prompt, 3);
    let ragContext = '';
    if (relatedQuestions.length > 0) {
      ragContext = '\n\n# 【参考：関連する過去問データ】\n';
      ragContext += '以下の過去問と解説を参考にして回答してください。\n\n';
      relatedQuestions.forEach((q, i) => {
        ragContext += `## 過去問${i + 1}: ${q.year}年本試験 第${q.questionNumber}問\n`;
        ragContext += `- 分野: ${q.mainTags.join('、')}${q.subTags.length > 0 ? ` / ${q.subTags.join('、')}` : ''}\n`;
        ragContext += `- 難易度: ${q.difficulty}、正答率: ${q.correctRate}\n`;
        if (q.problemText) {
          ragContext += `- 問題文: ${q.problemText.substring(0, 200)}${q.problemText.length > 200 ? '...' : ''}\n`;
        }
        if (q.summaryExplanation) {
          ragContext += `- 解説: ${q.summaryExplanation.substring(0, 300)}${q.summaryExplanation.length > 300 ? '...' : ''}\n`;
        }
        ragContext += '\n';
      });
      console.log(`RAG: Found ${relatedQuestions.length} related questions for: ${prompt.substring(0, 50)}`);
    }

    // RAG: 関連する授業内容を検索
    const relatedLectures = searchLecturesForRAG(prompt, 2);
    let lectureContext = '';
    if (relatedLectures.length > 0) {
      lectureContext = '\n\n# 【参考：過去の授業での解説】\n';
      lectureContext += '以下は講師が過去の授業で解説した内容です。この情報も参考にして回答してください。\n\n';
      relatedLectures.forEach(lecture => {
        lectureContext += lecture + '\n\n';
      });
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

    // 時期情報を取得
    const { month, period, periodDetail, daysToExam } = getStudyPeriod();

    // 生徒プロフィールを含めたシステムプロンプト
    let systemPrompt = `あなたは高校地理を学ぶ生徒をサポートする親しみやすい地理の先生です。

# 【現在の時期】
- 現在: ${month}月（${period}）
- 共通テストまで: 約${daysToExam}日
- ${periodDetail}
`;

    // 生徒プロフィール情報があれば追加
    if (Object.keys(session.profile).length > 0) {
      systemPrompt += `\n\n# 【この生徒の情報】\n`;
      if (session.profile.grade) systemPrompt += `- 学年: ${session.profile.grade}\n`;
      if (session.profile.targetScore) systemPrompt += `- 目標点: ${session.profile.targetScore}点\n`;
      if (session.profile.currentScore) systemPrompt += `- 現在の実力: ${session.profile.currentScore}点\n`;
      if (session.profile.weakAreas && session.profile.weakAreas.length > 0) {
        systemPrompt += `- 苦手分野: ${session.profile.weakAreas.join('、')}\n`;
      }
    }

    systemPrompt += `

# 【共通テスト地理の基本仕様】
- 試験時間：60分
- 総問題数：30〜31問（解答個数も30〜32個）
- 大問構成：6題（2025年度から新課程）
  ①生活文化 ②地域調査（地理総合）
  ③自然環境と自然災害 ④資源と産業 ⑤都市 ⑥世界地誌（地理探究）
- 形式：全問マーク式
  - 正しい組合せを選ぶ問題が約6割
  - 4〜6つの組合せから選択する設問が中心
  - 3つの文章の正誤を組み合わせた8択問題もあり

# 【出題傾向】
- すべての問題で資料（地図、グラフ、写真、模式図）が使用される
- 地形図（新旧比較）は必ず出題
- 統計表やグラフ（棒グラフ、折れ線、散布図）が多用される
- 自然災害・防災に関する問題は頻出
- 時事的話題はほぼ出題されない（統計データは約5年前まで）
- 地理的事象の「なぜ」を問う思考力重視の問題が増加傾向

# 【難易度と得点戦略】
- 理系国公立の現実的な目標：75-80点（9割は難しい）
- 時間配分：1問2分が目安だが、資料読解問題は3-4分かかる
- 見直し時間：5-10分確保が理想
- 「わからない問題は飛ばす」勇気が8割超えのカギ
- 高得点を取るという意味ではやや難度が高い科目

# 【理系生徒の特徴】
- 計算・グラフ読解は得意だが、文章読解で時間を使いすぎる傾向
- 「覚える」より「理解する」姿勢が強すぎて非効率になりがち
- 数学・理科優先で地理は後回し → 直前期に焦るパターン多発

# 【学習方法の王道】
- 学習順序：系統地理（特に気候・地形）→ 地誌
- 地図帳・資料集は「調べる」使い方を推奨
- 統計は暗記より「なぜそうなるか」の理解優先
- 地理は「直前の詰め込みが効かない」科目 → コツコツ型向き
- 白地図作業で地名を定着させる

# 【よくある悩みへの対応】
- 「統計の数字を全部暗記すべきか」→ 不要、順位・傾向で十分
- 「60→70点の壁」→ 資料読解の精度向上が必要
- 「歴史の方が良かった？」→ 選択変更は高2秋までが限界

# 【指導方針】
1. まず生徒に考えさせる問いかけをする
2. 図表の読み取り方を丁寧に教える（どこに注目するか）
3. 地理的な因果関係（自然条件×人間活動）を重視
4. 一度に答えを与えず、段階的に理解を深める
5. 正解を褒め、間違いは丁寧に訂正する
6. 関連する知識も補足する
7. 生徒の学年・目標点に応じた個別最適化

# 【対話スタイル】
- 絵文字や親しみやすい言葉遣いで、分かりやすく説明
- 「なぜそう思う？」「どこに注目した？」など問いかける
- 深夜の質問には「明日まとめて回答するね」と健康管理も配慮
- 焦っている生徒には「今からでも間に合う範囲」を明示

# 【生徒の前提】
- 全員が80点目標の高3生（理系国公立志望）
- 学年や目標点を聞く必要はない
- 現在の時期に応じたアドバイスを心がける

# 【80点メソッド】共通テスト地理で80点を取るための3つの柱

## 1. 72の国の基本データを覚える
重要な72カ国について、以下を把握する:
- 地域・気候帯
- 1人あたりGDP（高所得/中所得/低所得）
- 人口規模（大/中/小）
- 主要産業・資源
- 試験に出やすいキーワード（例: ノルウェー→北海油田・フィヨルド・EU非加盟）

**覚え方のコツ**:
- 地域ごとにまとめて覚える（北欧→西欧→南欧...）
- 「高所得×小人口×資源国」などパターンで分類
- 地図帳で位置を確認しながら覚える

## 2. 100の公式を覚える（準備中）
地理の頻出パターンを公式化したもの。例:
- 「西岸海洋性気候 → 偏西風 → 年較差小」
- 「新期造山帯 → 石油・天然ガス」
- 「モンスーン → 稲作 → 人口稠密」

## 3. 重要問題を解いて理解を深める（準備中）
過去問の中から特に重要な問題（重要度3）を厳選。
- 頻出パターンの理解
- 資料読解の練習
- 間違いやすいポイントの確認

**学習の進め方**:
- 春〜夏: 72カ国データ + 100の公式をインプット
- 秋: 重要問題で実戦演習
- 直前期: 苦手分野の復習 + 全体の確認

# 【利用可能な機能】
生徒は以下のコマンドを使えます：
- 「リセット」: 会話履歴をクリア
- 「2025年第1問」: 特定の問題の詳細を表示
- 「気候の問題」: 分野で問題を検索（最大10件）
- 「ノルウェーについて」「ブラジルのデータ」: 72カ国の基本データを表示

これらのコマンドを自然な会話の中で紹介してあげてください。
特に国名が出てきたときは「〇〇のデータ」と送ると詳しく見れるよ！と案内すると良い。`;

    // RAGコンテキストがあればシステムプロンプトに追加
    if (ragContext) {
      systemPrompt += ragContext;
    }

    // 講義コンテキストがあればシステムプロンプトに追加
    if (lectureContext) {
      systemPrompt += lectureContext;
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
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

    // LINEは5000文字制限
    if (responseText.length > 4500) {
      return responseText.substring(0, 4500) + '\n\n...(続きは次のメッセージで)';
    }

    return responseText;
  } catch (error: unknown) {
    console.error('Error calling Claude API for LINE:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return `エラーが発生しました: ${errorMessage}`;
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

// Google Sheetsから問題データを取得（年度・問題番号指定）
async function getQuestionFromSheets(year: string, examType: '本試験' | '追試験', questionNumber: number): Promise<Question | null> {
  try {
    const sheets = getGoogleSheetsClient();
    const sheetName = `${year}年${examType}`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A2:N`, // ヘッダー行をスキップ
    });

    const rows = response.data.values || [];

    // 問題番号で検索
    const row = rows.find((r) => {
      const qNum = r[1]; // B列: 問題番号
      return qNum && parseInt(qNum) === questionNumber;
    });

    if (!row) return null;

    const categoryString = row[2] || '';
    const { mainTags, subTags } = parseTags(categoryString);

    return {
      id: row[0] || '',
      questionId: row[1] || '',
      category: categoryString,
      mainTags,
      subTags,
      answer: row[3] || '',
      correctRate: row[4] || '',
      difficulty: row[5] || '',
      isImportant: row[6] || '',
      imageUrl: row[7] || '',
      year: row[8] || year,
      notes: row[9] || '',
      createdDate: row[10] || '',
      imageFile: row[11] || '',
      questionText: row[12] || '',
      fullQuestionText: row[13] || '',
    };
  } catch (error) {
    console.error('Error fetching question from Sheets:', error);
    return null;
  }
}

// 分野で問題を検索
async function searchQuestionsByCategory(category: string): Promise<Question[]> {
  try {
    const sheets = getGoogleSheetsClient();
    const questions: Question[] = [];

    // 全年度を検索（2021-2025年本試験）
    for (let year = 2025; year >= 2021; year--) {
      const sheetName = `${year}年本試験`;

      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheetName}!A2:N`,
        });

        const rows = response.data.values || [];

        rows.forEach((row) => {
          const categoryString = row[2] || '';
          const { mainTags, subTags } = parseTags(categoryString);

          // カテゴリに部分一致する問題を追加
          if (categoryString.includes(category) || mainTags.some(t => t.includes(category)) || subTags.some(t => t.includes(category))) {
            questions.push({
              id: row[0] || '',
              questionId: row[1] || '',
              category: categoryString,
              mainTags,
              subTags,
              answer: row[3] || '',
              correctRate: row[4] || '',
              difficulty: row[5] || '',
              isImportant: row[6] || '',
              imageUrl: row[7] || '',
              year: row[8] || `${year}`,
              notes: row[9] || '',
              createdDate: row[10] || '',
              imageFile: row[11] || '',
              questionText: row[12] || '',
              fullQuestionText: row[13] || '',
            });
          }
        });
      } catch (err) {
        console.log(`Sheet ${sheetName} not found or error:`, err);
      }
    }

    return questions.slice(0, 10); // 最大10問まで
  } catch (error) {
    console.error('Error searching questions by category:', error);
    return [];
  }
}

// 72カ国データ用のスプレッドシートID
const COUNTRY_DATA_SPREADSHEET_ID = '1DOE8cJNxf4SkosUooveiGQTQuod1uzdJK3n9wS4O5G4';

// 講義データのキャッシュ（MDファイルから読み込み）
let lecturesCache: string | null = null;

// 講義データを読み込み（MDファイルから）
function loadLectureData(): string {
  if (lecturesCache) {
    return lecturesCache;
  }

  try {
    const filePath = path.join(process.cwd(), 'lecture-content-combined.md');
    lecturesCache = fs.readFileSync(filePath, 'utf-8');
    console.log(`Loaded lecture content: ${lecturesCache.length} characters`);
    return lecturesCache;
  } catch (error) {
    console.error('Error loading lecture data:', error);
    return '';
  }
}

// 講義データからキーワード検索（MD形式対応）
function searchLecturesForRAG(userQuery: string, maxResults: number = 2): string[] {
  const lectureContent = loadLectureData();
  if (!lectureContent) return [];

  // ストップワード
  const stopWords = ['の', 'は', 'が', 'を', 'に', 'で', 'と', 'から', 'まで', 'より', 'について', 'とは', 'って', '何', 'どう', 'なぜ', 'どの', 'どこ', 'いつ', 'だれ', 'わから', 'ない', '教えて', 'ください', 'です', 'ます', 'した', 'する', 'ある', 'いる', 'こと', 'もの', 'よう', 'ため'];

  // キーワード抽出
  const keywordPattern = /[ァ-ヶー]{2,}|[一-龯]{2,}|[A-Za-z0-9]{2,}/g;
  const extractedKeywords = userQuery.match(keywordPattern) || [];
  const keywords = extractedKeywords.filter(kw => !stopWords.includes(kw) && kw.length >= 2);

  if (keywords.length === 0) {
    return [];
  }

  // MDファイルを授業ごとに分割（## で始まるセクション）
  const sections = lectureContent.split(/\n---\n/).filter(s => s.trim());

  // 各セクションをスコアリング
  const scoredSections = sections.map(section => {
    let score = 0;
    const searchText = section.toLowerCase();

    for (const keyword of keywords) {
      const kw = keyword.toLowerCase();
      const matches = (searchText.match(new RegExp(kw, 'g')) || []).length;
      score += matches * 2;
    }

    // 日付を抽出（## XX/XX の授業）
    const dateMatch = section.match(/## (\d+\/\d+) の授業/);
    const date = dateMatch ? dateMatch[1] : '不明';

    return { section, score, date };
  });

  // スコア順にソートして上位を返す
  const topSections = scoredSections
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  if (topSections.length === 0) {
    return [];
  }

  console.log(`Lecture RAG: Found ${topSections.length} relevant sections for keywords: ${keywords.join(', ')}`);

  // 関連する段落を抽出
  return topSections.map(s => {
    const paragraphs = s.section.split('\n').filter(p => p.trim().length > 0);
    const relevantParagraphs: string[] = [];

    for (const paragraph of paragraphs) {
      const pLower = paragraph.toLowerCase();
      for (const keyword of keywords) {
        if (pLower.includes(keyword.toLowerCase()) && paragraph.length > 30 && paragraph.length < 500) {
          relevantParagraphs.push(paragraph.trim());
          break;
        }
      }
      if (relevantParagraphs.length >= 3) break;
    }

    return `【${s.date}の授業より】\n${relevantParagraphs.join('\n')}`;
  });
}

// RAG用: 問題データのキャッシュ（サーバー起動時に1回読み込み）
interface QuestionForRAG {
  year: string;
  questionNumber: string;
  mainTags: string[];
  subTags: string[];
  problemText: string;      // I列: 問題文
  summaryExplanation: string; // K列: 要約解説文
  difficulty: string;
  correctRate: string;
  answer: string;
}

let questionsCache: QuestionForRAG[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1時間キャッシュ

// 全問題データをキャッシュに読み込み
async function loadQuestionsForRAG(): Promise<QuestionForRAG[]> {
  const now = Date.now();
  if (questionsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return questionsCache;
  }

  console.log('Loading questions for RAG cache...');
  const sheets = getGoogleSheetsClient();
  const questions: QuestionForRAG[] = [];

  // 2016-2025年本試験を読み込み
  const years = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];

  for (const year of years) {
    try {
      const sheetName = `${year}年本試験`;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A2:L`, // A〜L列を取得
      });

      const rows = response.data.values || [];

      for (const row of rows) {
        const categoryString = row[2] || '';
        const { mainTags, subTags } = parseTags(categoryString);

        questions.push({
          year,
          questionNumber: row[0] || '', // A列: 通し番号
          mainTags,
          subTags,
          problemText: row[8] || '',      // I列: 問題文
          summaryExplanation: row[10] || '', // K列: 要約解説文
          difficulty: row[6] || '',       // G列: 難易度
          correctRate: row[5] || '',      // F列: 正答率
          answer: row[4] || '',           // E列: 正答選択肢
        });
      }
    } catch (err) {
      console.log(`Failed to load ${year}年本試験:`, err);
    }
  }

  questionsCache = questions;
  cacheTimestamp = now;
  console.log(`Loaded ${questions.length} questions for RAG`);
  return questions;
}

// キーワードで問題を検索（RAG用）
async function searchQuestionsForRAG(userQuery: string, maxResults: number = 3): Promise<QuestionForRAG[]> {
  const questions = await loadQuestionsForRAG();

  // ユーザークエリからキーワードを抽出（単純な形態素分割）
  // ストップワードを除去
  const stopWords = ['の', 'は', 'が', 'を', 'に', 'で', 'と', 'から', 'まで', 'より', 'について', 'とは', 'って', '何', 'どう', 'なぜ', 'どの', 'どこ', 'いつ', 'だれ', 'わから', 'ない', '教えて', 'ください', 'です', 'ます', 'した', 'する', 'ある', 'いる', 'こと', 'もの', 'よう', 'ため'];

  // キーワード抽出（2文字以上の連続するカタカナ・漢字・英数字）
  const keywordPattern = /[ァ-ヶー]{2,}|[一-龯]{2,}|[A-Za-z0-9]{2,}/g;
  const extractedKeywords = userQuery.match(keywordPattern) || [];

  // ストップワードを除去
  const keywords = extractedKeywords.filter(kw => !stopWords.includes(kw) && kw.length >= 2);

  if (keywords.length === 0) {
    return [];
  }

  console.log('RAG search keywords:', keywords);

  // スコアリング
  const scoredQuestions = questions.map(q => {
    let score = 0;
    const searchText = `${q.problemText} ${q.summaryExplanation} ${q.mainTags.join(' ')} ${q.subTags.join(' ')}`.toLowerCase();

    for (const keyword of keywords) {
      const kw = keyword.toLowerCase();
      // 問題文に含まれる場合
      if (q.problemText.toLowerCase().includes(kw)) {
        score += 3;
      }
      // 解説文に含まれる場合
      if (q.summaryExplanation.toLowerCase().includes(kw)) {
        score += 2;
      }
      // タグに含まれる場合
      if (q.mainTags.some(t => t.toLowerCase().includes(kw))) {
        score += 2;
      }
      if (q.subTags.some(t => t.toLowerCase().includes(kw))) {
        score += 1;
      }
    }

    return { question: q, score };
  });

  // スコア順にソートして上位を返す
  return scoredQuestions
    .filter(sq => sq.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(sq => sq.question);
}

// 国データの型定義
interface CountryData {
  id: string;
  country_ja: string;
  region: string;
  gdp_per_capita_level: string;
  gdp_per_capita_estimate: string;
  population_level: string;
  population_estimate: string;
  main_climate: string;
  key_industries_resources: string;
  geo_keywords: string;
  note: string;
  exam_story: string;
}

// 72カ国データから国を検索
async function getCountryData(countryName: string): Promise<CountryData | null> {
  try {
    const sheets = getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: COUNTRY_DATA_SPREADSHEET_ID,
      range: 'Geo_Countries_72!A2:L',
    });

    const rows = response.data.values || [];

    // 国名で検索（部分一致）
    const row = rows.find((r) => {
      const name = r[1] || '';
      return name.includes(countryName) || countryName.includes(name);
    });

    if (!row) return null;

    return {
      id: row[0] || '',
      country_ja: row[1] || '',
      region: row[2] || '',
      gdp_per_capita_level: row[3] || '',
      gdp_per_capita_estimate: row[4] || '',
      population_level: row[5] || '',
      population_estimate: row[6] || '',
      main_climate: row[7] || '',
      key_industries_resources: row[8] || '',
      geo_keywords: row[9] || '',
      note: row[10] || '',
      exam_story: row[11] || '',
    };
  } catch (error) {
    console.error('Error fetching country data:', error);
    return null;
  }
}
