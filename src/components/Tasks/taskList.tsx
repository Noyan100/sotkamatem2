"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { TaskCard } from "./taskCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Task } from "@prisma/client";
import { toast } from "sonner";

interface TaskListResponse {
  data: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const DEFAULT_LIMIT = 10;

export const TaskList = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const rawSearchParams = useSearchParams();

  // Создаем безопасный объект searchParams
  const searchParams = rawSearchParams || new URLSearchParams();

  const [state, setState] = useState<{
    tasks: Task[] | null;
    loading: boolean;
    error: string | null;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>({
    tasks: null,
    loading: true,
    error: null,
    pagination: {
      page: 1,
      limit: DEFAULT_LIMIT,
      total: 0,
      totalPages: 1,
    },
  });

  const fetchTasks = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const params = new URLSearchParams(searchParams.toString());
      const page = parseInt(params.get("page") || "1");
      const limit = parseInt(params.get("limit") || DEFAULT_LIMIT.toString());

      if (isNaN(page) || page < 1) params.set("page", "1");
      if (isNaN(limit)) params.set("limit", DEFAULT_LIMIT.toString());

      const response = await fetch(`/api/tasks?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status}`);
      }

      const data: TaskListResponse = await response.json();

      if (!data?.data || !Array.isArray(data.data)) {
        throw new Error("Некорректный формат данных");
      }

      setState({
        tasks: data.data,
        loading: false,
        error: null,
        pagination: data.pagination,
      });
    } catch (error) {
      console.error("Ошибка:", error);
      setState({
        tasks: [],
        loading: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
        pagination: {
          page: 1,
          limit: DEFAULT_LIMIT,
          total: 0,
          totalPages: 1,
        },
      });
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Ошибка при удалении задания");
      }

      toast.success("Задание удалено");

      // Оптимистичное обновление
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks?.filter((task) => task.id !== taskId) || null,
        pagination: {
          ...prev.pagination,
          total: prev.pagination.total - 1,
          totalPages: Math.ceil(
            (prev.pagination.total - 1) / prev.pagination.limit
          ),
        },
      }));

      // Если это был последний элемент на странице
      if (state.tasks?.length === 1 && state.pagination.page > 1) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", (state.pagination.page - 1).toString());
        router.push(`?${params.toString()}`);
      }
    } catch (error) {
      console.error("Ошибка при удалении:", error);
      toast.error("Не удалось удалить задание");
      fetchTasks(); // Возвращаем актуальные данные
    }
  };

  const handleUpdateTask = async (updatedTask: {
    id: number;
    number: string;
    text: string;
    solution: string;
    answer: string;
    type: string;
    sources: any;
    image?: string | null;
  }) => {
    try {
      const response = await fetch(`/api/tasks?id=${updatedTask.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: updatedTask.number,
          text: updatedTask.text,
          solution: updatedTask.solution,
          answer: updatedTask.answer,
          type: updatedTask.type,
          sources: updatedTask.sources,
          image: updatedTask.image,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка при обновлении задания");
      }

      const updatedTaskData = await response.json();

      // Оптимистичное обновление UI
      setState((prev) => ({
        ...prev,
        tasks:
          prev.tasks?.map((task) =>
            task.id === updatedTask.id ? { ...task, ...updatedTaskData } : task
          ) || null,
      }));

      return updatedTaskData;
    } catch (error) {
      console.error("Ошибка при обновлении:", error);
      toast.error(
        error instanceof Error ? error.message : "Ошибка при обновлении"
      );
      throw error;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [searchParams]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  const renderPagination = () => {
    const { page, totalPages } = state.pagination;
    const maxVisiblePages = 5;
    const pages = [];

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const leftBound = Math.max(2, page - 1);
      const rightBound = Math.min(totalPages - 1, page + 1);

      pages.push(1);

      if (leftBound > 2) pages.push("...");

      for (let i = leftBound; i <= rightBound; i++) {
        pages.push(i);
      }

      if (rightBound < totalPages - 1) pages.push("...");

      pages.push(totalPages);
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              className={page <= 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>

          {pages.map((p, index) => (
            <PaginationItem key={index}>
              {p === "..." ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => handlePageChange(p as number)}
                  isActive={page === p}
                >
                  {p}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
              className={
                page >= totalPages ? "pointer-events-none opacity-50" : ""
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  if (state.loading && state.tasks === null) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="text-center py-12 space-y-4">
        <h3 className="text-lg font-medium">Произошла ошибка</h3>
        <p className="text-muted-foreground">{state.error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Повторить попытку
        </Button>
      </div>
    );
  }

  if (!state.tasks || state.tasks.length === 0) {
    const hasFilters = Array.from(searchParams.keys()).some(
      (key) => key !== "page" && key !== "limit"
    );

    return (
      <div className="text-center py-12 space-y-2">
        <h3 className="text-lg font-medium">
          {hasFilters ? "Задания не найдены" : "Нет доступных заданий"}
        </h3>
        <p className="text-muted-foreground">
          {hasFilters
            ? "Попробуйте изменить параметры фильтрации"
            : "Пока не добавлено ни одного задания"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="space-y-4">
        {state.tasks.map((task) => (
          <TaskCard
            key={task.id}
            id={task.id}
            number={task.number}
            image={task.image}
            text={task.text}
            sources={task.sources}
            solution={task.solution}
            answer={task.answer}
            type={task.type ?? undefined}
            videoSrc={task.videoSrc}
            onDelete={handleDeleteTask}
            onUpdate={handleUpdateTask}
          />
        ))}
      </div>

      {state.pagination.totalPages > 1 && renderPagination()}
    </div>
  );
};
