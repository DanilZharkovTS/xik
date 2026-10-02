import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({
    accessToken: null,
    user: null,
  })
}

export async function GET() {
  return NextResponse.json({
    accessToken: null,
    user: null,
  })
}
