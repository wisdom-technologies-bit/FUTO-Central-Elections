import { v2 as cloudinary } from 'cloudinary'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const cookieStore = await cookies()
  if (!cookieStore.get('admin_session')?.value) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const timestamp = Math.floor(Date.now() / 1000)
  const folder = 'futo-central-elections/candidates'
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, process.env.CLOUDINARY_API_SECRET || '')
  return NextResponse.json({ signature, timestamp, folder, apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY, cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME })
}
