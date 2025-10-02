import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, questionId } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    // Claude APIで画像から問題文を抽出
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "url",
                url: imageUrl
              }
            },
            {
              type: "text",
              text: `この地理の問題画像から以下を抽出してJSONで返してください：

{
  "questionText": "問題文の全文",
  "keywords": ["キーワード1", "キーワード2", ...],
  "regions": ["地域名1", "地域名2", ...],
  "topics": ["分野1", "分野2", ...]
}

地理的な専門用語、地域名、気候、産業、地形などのキーワードを網羅的に抽出してください。`
            }
          ]
        }
      ]
    })

    const result = JSON.parse(message.content[0].text)
    
    return NextResponse.json({
      questionId,
      ...result,
      extractedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Text extraction error:', error)
    return NextResponse.json(
      { error: 'Failed to extract text from image' },
      { status: 500 }
    )
  }
}