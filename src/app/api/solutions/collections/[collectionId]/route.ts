// app/api/solutions/[collectionId]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: { collectionId: string } }
) {
    try {
        const { collectionId } = params;

        const solutions = await prisma.userSolution.findMany({
            where: {
                collectionId: Number(collectionId),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                taskSolutions: {
                    include: {
                        task: {
                            select: {
                                id: true,
                                number: true,
                                text: true,
                                answer: true,
                            },
                        },
                    },
                },
                collection: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(solutions);
    } catch (error) {
        console.error('Error fetching solutions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch solutions' },
            { status: 500 }
        );
    }
}