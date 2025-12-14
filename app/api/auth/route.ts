import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    const correctPassword = process.env.MEMBER_PASSWORD

    if (!correctPassword) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (password === correctPassword) {
      const token = Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64')
      return NextResponse.json({ success: true, token })
    }

    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
