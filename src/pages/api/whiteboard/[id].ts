import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  try {
    switch (req.method) {
      case 'GET':
        const whiteboard = await prisma.whiteboard.findUnique({ 
          where: { id: id as string },
          select: {
            id: true,
            title: true,
            data: true,
            assignmentId: true,
            nextOrder: true,
            prevOrder: true,
          }
        });

        if (!whiteboard) {
          return res.status(404).json({ error: 'Доска не найдена' });
        }

        // Устанавливаем кеширование на 60 секунд
        res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
        res.setHeader('CDN-Cache-Control', 'public, s-maxage=120');
        return res.json(whiteboard);

      case 'PUT':
        const { title, data, nextOrder, prevOrder } = req.body;
        
        const updated = await prisma.whiteboard.update({
          where: { id: id as string },
          data: {
            ...(title !== undefined && { title }),
            ...(data !== undefined && { data }),
            ...(nextOrder !== undefined && { nextOrder }),
            ...(prevOrder !== undefined && { prevOrder })
          }
        });

        // После изменения сбрасываем кеш
        res.setHeader('Cache-Control', 'no-store');
        return res.json(updated);

      case 'DELETE':
        const whiteboardToDelete = await prisma.whiteboard.findUnique({
          where: { id: id as string },
          select: { prevOrder: true, nextOrder: true }
        });

        if (!whiteboardToDelete) {
          return res.status(404).json({ error: 'Доска не найдена' });
        }

        // Обновляем ссылки у соседних досок
        if (whiteboardToDelete.prevOrder) {
          await prisma.whiteboard.update({
            where: { id: whiteboardToDelete.prevOrder },
            data: { nextOrder: whiteboardToDelete.nextOrder }
          });
        }

        if (whiteboardToDelete.nextOrder) {
          await prisma.whiteboard.update({
            where: { id: whiteboardToDelete.nextOrder },
            data: { prevOrder: whiteboardToDelete.prevOrder }
          });
        }

        // Удаляем саму доску
        await prisma.whiteboard.delete({ where: { id: id as string } });
        
        // После удаления сбрасываем кеш
        res.setHeader('Cache-Control', 'no-store');
        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}