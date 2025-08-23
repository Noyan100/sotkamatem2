// app/api/collection-assignments/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const collections = await prisma.collectionAssignment.findMany({
      include: {
        assignments: {
          include: {
            whiteboards: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(collections);
  } catch (error) {
    return NextResponse.json(
      { error: "Ошибка загрузки коллекций" },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  try {
    const { title } = await request.json();

    // Создаем подборку с одним заданием и одной доской по умолчанию
    const newCollection = await prisma.collectionAssignment.create({
      data: {
        title: title || "Новая подборка",
        collection: {
          create: {
            name: title || "Новая подборка",
            isPublished: false,
          }
        },
        assignments: {
          create: {
            title: "Задание 1",
            description: "Описание задания",
            whiteboards: {
              create: {
                title: "Страница 1",
                data: {},
              }
            }
          }
        }
      },
      include: {
        assignments: {
          include: {
            whiteboards: true,
          },
        },
        collection: true,
      },
    });

    return NextResponse.json(newCollection);
  } catch (error: any) {
    console.error("Error creating collection:", error);
    return NextResponse.json(
      { error: "Ошибка при создании подборки", details: error.message },
      { status: 500 }
    );
  }
}


// Delete a collection and all its contents
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    // First delete all assignments and their whiteboards (cascade)
    await prisma.collectionAssignment.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Ошибка при удалении подборки" },
      { status: 500 }
    );
  }
}