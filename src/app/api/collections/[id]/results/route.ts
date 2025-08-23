import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const collectionId = parseInt(params.id);
    if (isNaN(collectionId)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid collection ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Получаем пользователя и название подборки за один запрос
    const [user, collection] = await Promise.all([
      prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      }),
      prisma.collection.findUnique({
        where: { id: collectionId },
        select: { name: true }
      })
    ]);

    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!collection) {
      return new NextResponse(
        JSON.stringify({ error: 'Collection not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the latest solution with task details
    const userSolution = await prisma.userSolution.findFirst({
      where: {
        userId: user.id,
        collectionId,
      },
      orderBy: {
        finishedAt: 'desc',
      },
      include: {
        taskSolutions: {
          include: {
            task: {
              select: {
                id: true,
                text: true,
                answer: true,
                number: true,
                image: true,
                sources: true
              }
            }
          },
          orderBy: {
            task: {
              number: 'asc'
            }
          }
        },
      },
    });

    if (!userSolution) {
      return new NextResponse(
        JSON.stringify({ error: 'Solution not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate score
    const correctAnswers = userSolution.taskSolutions.filter(ts => ts.isCorrect).length;
    const totalTasks = userSolution.taskSolutions.length;

    return new NextResponse(
      JSON.stringify({
        solution: {
          id: userSolution.id,
          startedAt: userSolution.startedAt,
          finishedAt: userSolution.finishedAt,
          score: correctAnswers, // Просто число, а не объект
          totalTasks, // Добавляем общее количество задач отдельным полем
          taskSolutions: userSolution.taskSolutions.map(ts => ({
            id: ts.id,
            taskId: ts.taskId,
            userAnswer: ts.userAnswer,
            isCorrect: ts.isCorrect,
            task: {
              id: ts.task.id,
              text: ts.task.text,
              answer: ts.task.answer,
              number: ts.task.number,
              image: ts.task.image,
              sources: ts.task.sources
            },
          })),
        },
        collectionName: collection.name
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[RESULTS_GET]', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}