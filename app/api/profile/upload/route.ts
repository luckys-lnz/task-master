import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { fileName, fileType } = await req.json()

    if (!fileName || !fileType) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const fileExtension = fileName.split('.').pop()
    const key = `profile-images/${userId}/${Date.now()}.${fileExtension}`

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      ContentType: fileType,
    })

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

    // Update user's avatar URL in database
    const avatarUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    await db
      .update(users)
      .set({ avatarUrl })
      .where(eq(users.id, userId))

    return NextResponse.json({ signedUrl, avatarUrl })
  } catch (error) {
    console.error('[UPLOAD_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 