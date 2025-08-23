// app/api/solutions/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const solutionId = parseInt(params.id);
    
    if (isNaN(solutionId)) {
      return NextResponse.json(
        { error: 'Invalid solution ID' },
        { status: 400 }
      );
    }

    // 1. Находим все изображения решения
    const solutionImages = await prisma.solutionImage.findMany({
      where: { solutionId }
    });

    // 2. Удаляем файлы изображений с сервера
    const uploadsDir = path.join(process.cwd(), 'public');
    
    await Promise.all(
      solutionImages.map(async (image) => { 
        if (image.image) {
          const imagePath = path.join(uploadsDir, image.image);
          try {
            await unlink(imagePath);
          } catch (err) {
            console.error(`Failed to delete image ${imagePath}:`, err);
          }
        }
      })
    );

    // 3. Удаляем записи изображений из БД
    await prisma.solutionImage.deleteMany({
      where: { solutionId }
    });

    // 4. Удаляем решения задач (TaskSolution)
    await prisma.taskSolution.deleteMany({
      where: { userSolutionId: solutionId }
    });

    // 5. Удаляем само решение (UserSolution)
    const deletedSolution = await prisma.userSolution.delete({
      where: { id: solutionId }
    });

    return NextResponse.json({
      success: true,
      message: `Solution ${solutionId} and all related data deleted successfully`,
      deletedSolution
    });

  } catch (error) {
    console.error('Delete solution error:', error);
    return NextResponse.json(
      { error: 'Failed to delete solution', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}