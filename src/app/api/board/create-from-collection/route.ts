// app/api/board/create-from-collection/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodeHtmlToImage from 'node-html-to-image';
import katex from 'katex';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { collectionId, title } = await req.json();

    // Валидация
    if (!collectionId || !title) {
      return NextResponse.json(
        { error: 'Collection ID and title are required' },
        { status: 400 }
      );
    }

    // Получаем коллекцию с задачами
    const collection = await prisma.collection.findUnique({
      where: { id: parseInt(collectionId) },
      include: {
        collections: {
          include: { task: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    if (!collection.collections?.length) {
      return NextResponse.json(
        { error: 'Collection has no tasks' },
        { status: 400 }
      );
    }

    // Создаем CollectionAssignment
    const collectionAssignment = await prisma.collectionAssignment.create({
      data: {
        title: title || `Assignment for ${collection.name}`,
        collectionId: collection.id
      }
    });

    // Создаем задания и доски
    const assignments = [];
    for (let i = 0; i < collection.collections.length; i++) {
      const ct = collection.collections[i];
      
      // Генерируем изображение задачи
      const taskImageData = await generateTaskImage(ct.task);

      // Создаем Assignment
      const assignment = await prisma.assignment.create({
        data: {
          title: `Задание #${ct.task.number} №${ct.task.id}`,
          description: `Из подборки: ${collection.name}`,
          collectionAssignmentId: collectionAssignment.id,
          // Устанавливаем порядок
          nextOrder: i < collection.collections.length - 1 ? undefined : null,
          prevOrder: i > 0 ? undefined : null,
          whiteboards: {
          create: {
            title: `Страница 1`,
            data: {
              images: taskImageData ? [{
                id: `task-img-${ct.task.id}`,
                src: taskImageData.image,
                x: 5,
                y: 75,
                originalWidth: taskImageData.width,
                originalHeight: taskImageData.height,
                locked: false,
                scale: 1,
                rotation: 0,
                isDragging: true,
                isResizing: true,
                isRotating: true,
              }] : [],
                textElements: [],
                shapes: [],
                settings: {
                  brushColor: '#000000',
                  backgroundColor: '#ffffff'
                }
              }
            }
          }
        },
        include: {
          whiteboards: true
        }
      });

      assignments.push(assignment);
    }

    // Обновляем порядок заданий
    for (let i = 0; i < assignments.length; i++) {
      const nextId = i < assignments.length - 1 ? assignments[i+1].id : null;
      const prevId = i > 0 ? assignments[i-1].id : null;

      await prisma.assignment.update({
        where: { id: assignments[i].id },
        data: {
          nextOrder: nextId,
          prevOrder: prevId
        }
      });
    }

    // Получаем ID первой доски
    const firstWhiteboard = assignments[0]?.whiteboards[0];
    if (!firstWhiteboard) {
      throw new Error('Failed to create whiteboards');
    }

    return NextResponse.json({
      success: true,
      collectionAssignmentId: collectionAssignment.id,
      firstWhiteboardId: firstWhiteboard.id,
      totalTasks: assignments.length
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


async function getImageAsBase64(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;
  
  try {
    // Если URL относительный, добавляем базовый URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const absoluteUrl = url.startsWith('/') 
      ? `${baseUrl}${url}`
      : url;

    const response = await fetch(absoluteUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:${response.headers.get('content-type')};base64,${base64}`;
  } catch (error) {
    console.error('Failed to load image:', error);
    return '';
  }
}
const formatSources = (sources: any): string => {
    if (!sources) return "Не указаны";

    if (typeof sources === "string") return sources;

    if (!Array.isArray(sources)) {
      return JSON.stringify(sources);
    }

    // Разделяем источники по категориям
    const fipiSources = sources.filter(
      (source) => source.sourceType === "ФИПИ"
    );
    const mathegeSources = sources.filter(
      (source) => source.sourceType === "mathege"
    );
    const waveSources = sources.filter(
      (source) => source.sourceType === "Волны ЕГЭ"
    );
    const otherSources = sources.filter(
      (source) =>
        source.sourceType !== "ФИПИ" &&
        source.sourceType !== "mathege" &&
        source.sourceType !== "Волны ЕГЭ"
    );

    // Обрабатываем ФИПИ
    const fipiStrings = fipiSources.map((source) => {
      return `${source.sourceType}${
        source.name ? `: ${source.name}` : ""
      }`.trim();
    });

    // Обрабатываем mathege
    const mathegeStrings = mathegeSources.map((source) => {
      return `${source.sourceType}${
        source.name ? `: ${source.name}` : ""
      }`.trim();
    });

    // Обрабатываем волны ЕГЭ
    const waveGroups: Record<string, number[]> = {};

    waveSources.forEach((source) => {
      const wave = source.wave || "Неизвестная волна";
      const year = parseInt(source.year);

      if (!isNaN(year)) {
        if (!waveGroups[wave]) {
          waveGroups[wave] = [];
        }
        waveGroups[wave].push(year);
      }
    });

    const waveStrings = Object.entries(waveGroups).map(([wave, years]) => {
      const sortedYears = [...years].sort((a, b) => a - b);
      const ranges: string[] = [];
      let start = sortedYears[0];
      let prev = start;

      for (let i = 1; i <= sortedYears.length; i++) {
        const current = sortedYears[i];
        if (current === prev + 1) {
          prev = current;
        } else {
          ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
          start = current;
          prev = current;
        }
      }

      return `${wave} ${ranges.join(", ")}`;
    });

    // Обрабатываем остальные источники
    const otherStrings = otherSources.map((source) => {
      if (
        source.sourceType === "Сборники" ||
        source.sourceType === "Статград" ||
        source.sourceType === "Другое"
      ) {
        return `${source.sourceType}${
          source.name ? `: ${source.name}` : ""
        }`.trim();
      }
      return source.sourceType || "Неизвестный источник";
    });

    // Объединяем все источники в нужном порядке
    const allSources = [
      ...fipiStrings,
      ...mathegeStrings,
      ...waveStrings,
      ...otherStrings,
    ];

    return allSources.join(", ");
  };

async function generateTaskImage(task: any): Promise<{
  image: string;
  width: number;
  height: number;
} | null> {
  try {
    let imageHtml = '';
    if (task.image) {
      const imageUrl = await getImageAsBase64(task.image);
      if (imageUrl) {
        imageHtml = `<img src="${imageUrl}" style="max-width: 600px; height: 350px; margin-top: 15px;" />`;
      }
    }

    const sources = formatSources(task.sources);
    
    // Преобразуем LaTeX в HTML
    const renderedText = renderLatexToHtml(task.text);

    // Рассчитываем примерную высоту
    const lineHeight = 24;
    const lines = Math.ceil(task.text.length / 160);
    const textHeight = lines * lineHeight;
    
    // Учитываем заголовок, отступы и изображение
    const padding = lines > 2 ? 70 : 50;
    const headerHeight = lines > 2 ? 50 : 40;
    const imageHeight = task.image ? 360 : 0;
    const calculatedHeight = padding + headerHeight + textHeight + imageHeight;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        <style>
          body { margin: 0; padding: 0; }
          .katex { font: normal 1.21em KaTeX_Main; }
          .katex-display { margin: 1em 0; }
        </style>
      </head>
      <body>
        <div style="
          width: 1200px;
          min-height: ${calculatedHeight}px;
          padding: 12px; 
          background-color: white; 
          border-radius: 8px;
          font-family: sans-serif;
          box-sizing: border-box;
        ">
          <div style="display: flex; flex-direction: column;">
            <div>
              <div style="display: flex; flex-wrap: wrap; align-items: baseline; gap: 2em;">
                <span style="font-weight: 600;">Задание #${task.number}</span>
                <span style="color: blue;">№${task.id}</span>
              </div>
              <div style="width: 1160px; word-wrap: break-word; font-size: 16px; line-height: ${lineHeight}px; margin-top: 12px; padding-right: 4px;">
                ${renderedText}
              </div>
              
              <div style="margin-top: 12px">${imageHtml}</div>
            </div>

            <div style="width: 1160px; word-wrap: break-word; margin-top: 12px; margin-right: 32px; color: #9E9E9E; text-align: right;">
              <div style="font-weight: 400; margin-bottom: 8px;">Источники: ${sources}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const image = await nodeHtmlToImage({
      html,
      quality: 100,
      type: 'png',
      encoding: 'base64',
      puppeteerArgs: {
        defaultViewport: {
          width: 1200,
          height: calculatedHeight,
          deviceScaleFactor: 2,
        },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    }) as string;

    return {
      image: `data:image/png;base64,${image}`,
      width: 1200,
      height: calculatedHeight
    };
  } catch (error) {
    console.error('Image generation failed:', error);
    return null;
  }
}

// Функция для преобразования LaTeX в HTML
function renderLatexToHtml(content: string): string {
  if (!content) return '';

  const latexRegex = /(\$\$.*?\$\$|\$.*?\$|\\\(.*?\\\)|\\\[.*?\\\]|\\begin\{.*?\}.*?\\end\{.*?\})/;
  const parts = content.split(latexRegex);

  return parts.map((part) => {
    if (!part) return '';

    try {
      // Блочный LaTeX ($$...$$ или \[...\])
      if ((part.startsWith('$$') && part.endsWith('$$')) || 
          (part.startsWith('\\[') && part.endsWith('\\]'))) {
        const latexContent = part.startsWith('$$') ? part.slice(2, -2) : part.slice(2, -2);
        return katex.renderToString(latexContent, {
          displayMode: true,
          throwOnError: false
        });
      }
      
      // Строчный LaTeX ($...$ или \(...\))
      if ((part.startsWith('$') && part.endsWith('$')) || 
          (part.startsWith('\\(') && part.endsWith('\\)'))) {
        const latexContent = part.startsWith('$') ? part.slice(1, -1) : part.slice(2, -2);
        return katex.renderToString(latexContent, {
          displayMode: false,
          throwOnError: false
        });
      }
      
      // Блочные среды (begin/end)
      if (part.startsWith('\\begin{') && part.includes('\\end{')) {
        return katex.renderToString(part, {
          displayMode: true,
          throwOnError: false
        });
      }
      
      // Обычный текст
      return part;
    } catch (error) {
      console.error('LaTeX rendering error:', error);
      return part; // Возвращаем оригинальный текст в случае ошибки
    }
  }).join('');
}