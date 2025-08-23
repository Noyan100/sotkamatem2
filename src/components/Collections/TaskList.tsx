// components/TaskList.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { LatexText } from "@/components/LatextText";
import { Task } from "@/types/types"; // Импортируем единый тип

interface TaskListProps {
  tasks: {
    id: string;
    taskId: number;
    order: number | null;
    task?: Task; // Используем единый тип
  }[];
}

export function TaskList({ tasks }: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loadingTask, setLoadingTask] = useState(false);

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

  const fetchTask = async (taskId: number) => {
    try {
      setLoadingTask(true);
      const response = await fetch(`/api/tasks/${taskId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch task");
      }

      const data = await response.json();
      setSelectedTask(data);
    } catch (err) {
      console.error("Failed to load task:", err);
      toast.error("Failed to load task");
    } finally {
      setLoadingTask(false);
    }
  };

  if (loadingTask) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return <p className="text-gray-500">Нет заданий в подборке</p>;
  }

  return (
    <div className="space-y-6">
      {/* Список задач */}
      <ul className="space-y-2">
        {tasks.map((collectionTask) => (
          <li
            key={`${collectionTask.taskId}-${collectionTask.order}`}
            className={`p-5 border rounded-lg`}
          >
            <div className="flex gap-2 mb-1">
              <div className="font-medium ">
                Задание #{collectionTask.task?.number}
              </div>{" "}
              <div className="text-blue-600">№{collectionTask.taskId}</div>
            </div>
            {collectionTask.task?.text && (
              <LatexText content={collectionTask.task.text} />
            )}
            {collectionTask.task?.image && (
              <img
                src={collectionTask.task.image}
                alt="Task illustration"
                className="max-w-full h-auto rounded mt-4"
                width="300px"
              />
            )}
            <div className="mt-4 text-right text-sm text-gray-500 ">
              Источники: {formatSources(collectionTask.task?.sources)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
