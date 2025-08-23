import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  switch (req.method) {
    case 'GET':
      try {
        const whiteboards = await prisma.whiteboard.findMany({
          orderBy: { updatedAt: 'desc' },
          include: {
            assignment: true
          }
        });
        res.status(200).json(whiteboards);
      } catch (error) {
        res.status(500).json({ error: 'Ошибка при загрузке досок' });
      }
      break;

    case 'POST':
      try {
        const { title, data, assignmentId } = req.body;
        
        // Находим последнюю доску в задании
        const lastWhiteboard = await prisma.whiteboard.findFirst({
          where: { assignmentId, nextOrder: null },
          orderBy: { createdAt: 'desc' }
        });
        
        const whiteboard = await prisma.whiteboard.create({
          data: {
            title: title || 'Новая доска',
            data: data || {},
            assignmentId: assignmentId || null,
            // Если есть последняя доска, обновляем ссылки
            ...(lastWhiteboard && {
              prevOrder: lastWhiteboard.id,
            })
          }
        });
        
        // Обновляем nextOrder у предыдущей доски
        if (lastWhiteboard) {
          await prisma.whiteboard.update({
            where: { id: lastWhiteboard.id },
            data: { nextOrder: whiteboard.id }
          });
        }
        
        res.status(201).json(whiteboard);
      } catch (error) {
        res.status(500).json({ error: 'Ошибка при создании доски' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}