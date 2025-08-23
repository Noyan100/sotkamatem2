import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { userIds } = await req.json();
    const groupId = (await params).groupId;
    
    await prisma.groupUser.createMany({
      data: (Array.isArray(userIds) ? userIds : [userIds]).map((userId: number) => ({
        groupId: Number(groupId),
        userId
      })),
      skipDuplicates: true
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add users to group' },
      { status: 500 }
    );
  }
}