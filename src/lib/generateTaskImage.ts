import puppeteer from 'puppeteer';
import { Task } from '@prisma/client';

export async function generateTaskImage(task: Task): Promise<string | null> {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  try {
    // Генерируем HTML для задачи (аналогично вашему фронтенд-компоненту)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              background: white;
              width: 800px;
              margin: 0 auto;
            }
            .task-container {
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 20px;
              background: white;
            }
            .task-number {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .task-content {
              font-size: 16px;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <div class="task-container">
            <div class="task-number">Задача ${task.number}</div>
            <div class="task-content">${task.text}</div>
          </div>
        </body>
      </html>
    `;

    await page.setContent(html);
    await page.setViewport({ width: 800, height: 600 });

    // Делаем скриншот
    const screenshot = await page.screenshot({
      type: 'png',
      encoding: 'base64',
      fullPage: true,
      omitBackground: true,
    });

    return `data:image/png;base64,${screenshot}`;
  } catch (error) {
    console.error('Error generating task image:', error);
    return null;
  } finally {
    await browser.close();
  }
}