"use client";

import { useEffect, useState, useRef } from "react";
import Whiteboard from "@/components/Whiteboard/Whiteboard";
import { redirect, useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useSWR, { mutate } from "swr"; // Добавлен mutate
import { toast } from "sonner";
import { useSession } from "next-auth/react";

type WhiteboardData = {
  id: string;
  title: string;
  data: any;
  assignmentId?: string;
  nextOrder?: string | null;
  prevOrder?: string | null;
  assignment?: {
    id: string;
    title: string;
    nextOrder?: string | null;
    prevOrder?: string | null;
    whiteboards: any;
  };
};

export type WhiteboardHandle = {
  save: () => Promise<boolean>;
};

type WhiteboardProps = {
  whiteboardId: string;
  whiteboardTitle?: string;
  // другие пропсы, если есть
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function WhiteboardPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const whiteboardRef = useRef<WhiteboardHandle>(null);
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status === "authenticated" && (session.user as any)?.role !== "ADMIN") {
      redirect("/tasks");
    }
  }, [session, status]);

  const {
    data: whiteboardData,
    error: whiteboardError,
    isLoading: whiteboardLoading,
    mutate: mutateWhiteboard,
  } = useSWR<WhiteboardData>(id ? `/api/whiteboard/${id}` : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const { data: prevBoard, mutate: mutatePrevBoard } = useSWR<WhiteboardData>(
    whiteboardData?.prevOrder
      ? `/api/whiteboard/${whiteboardData.prevOrder}`
      : null,
    fetcher
  );
  const { data: nextBoard, mutate: mutateNextBoard } = useSWR<WhiteboardData>(
    whiteboardData?.nextOrder
      ? `/api/whiteboard/${whiteboardData.nextOrder}`
      : null,
    fetcher
  );

  const { data: assignmentData, mutate: mutateAssignment } = useSWR(
    whiteboardData?.assignmentId
      ? `/api/assignment/${whiteboardData.assignmentId}`
      : null,
    fetcher
  );

  const { data: prevAssignment, mutate: mutatePrevAssignment } = useSWR(
    assignmentData?.prevOrder
      ? `/api/assignment/${assignmentData.prevOrder}`
      : null,
    fetcher
  );
  const { data: nextAssignment, mutate: mutateNextAssignment } = useSWR(
    assignmentData?.nextOrder
      ? `/api/assignment/${assignmentData.nextOrder}`
      : null,
    fetcher
  );

  const createNewWhiteboard = async () => {
    if (!whiteboardData?.assignmentId) return;

    try {
      // Save current whiteboard before creating a new one
      if (whiteboardRef.current) {
        const success = await whiteboardRef.current.save();
        if (!success) {
          toast.error("Не удалось сохранить текущую доску");
          return;
        }
      }

      const response = await fetch("/api/whiteboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Страница ${(assignmentData?.whiteboards?.length || 0) + 1}`,
          assignmentId: whiteboardData.assignmentId,
          prevOrder: whiteboardData.id,
        }),
      });

      if (response.ok) {
        const newWhiteboard = await response.json();

        // Update current whiteboard's nextOrder
        await fetch(`/api/whiteboard/${whiteboardData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nextOrder: newWhiteboard.id }),
        });

        // Перевалидируем данные текущей доски и связанные данные
        await Promise.all([
          mutateWhiteboard(), // Обновляем текущую доску
          mutate(`/api/assignment/${whiteboardData.assignmentId}`), // Обновляем задание
          mutateNextBoard(), // Обновляем следующую доску (если была)
        ]);

        // Navigate to the new whiteboard
        router.push(`/whiteboard/${newWhiteboard.id}`);
        toast.success("Новая страница создана");
      }
    } catch (error) {
      toast.error("Ошибка при создании страницы");
      console.error("Ошибка при создании страницы:", error);
    }
  };

  const navigateToBoard = async (boardId: string) => {
    if (whiteboardRef.current) {
      const success = await whiteboardRef.current.save();
      if (success) {
        router.push(`/whiteboard/${boardId}`);
      } else {
        alert("Не удалось сохранить текущую доску");
      }
    } else {
      router.push(`/whiteboard/${boardId}`);
    }
  };

  const navigateToAssignment = async (assignmentId: string) => {
    if (whiteboardRef.current) {
      const success = await whiteboardRef.current.save();
      if (success) {
        // Получаем первую доску задания
        const assignmentResponse = await fetch(
          `/api/assignment/${assignmentId}`
        );
        const assignment = await assignmentResponse.json();
        if (assignment.whiteboards && assignment.whiteboards.length > 0) {
          router.push(`/whiteboard/${assignment.whiteboards[0].id}`);
        }
      } else {
        alert("Не удалось сохранить текущую доску");
      }
    } else {
      const assignmentResponse = await fetch(`/api/assignment/${assignmentId}`);
      const assignment = await assignmentResponse.json();
      if (assignment.whiteboards && assignment.whiteboards.length > 0) {
        router.push(`/whiteboard/${assignment.whiteboards[0].id}`);
      }
    }
  };

  if (whiteboardLoading) return <div className="p-4">Загрузка доски...</div>;
  if (whiteboardError)
    return <div className="p-4 text-red-500">Ошибка загрузки данных</div>;

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white p-4 border-b flex justify-between items-center z-[1000]">
        <div className="flex items-center space-x-2">
          <Link href="/whiteboard">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>

          {prevBoard && (
            <Button
              variant="outline"
              onClick={() => navigateToBoard(prevBoard.id)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Предыдущая
            </Button>
          )}

          {prevAssignment && (
            <Button
              variant="outline"
              onClick={() => navigateToAssignment(prevAssignment.id)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Предыдущее задание
            </Button>
          )}
        </div>

        <h1 className="text-xl font-semibold">
          {whiteboardData?.title || "Безымянная доска"}
          {assignmentData && (
            <span className="text-sm text-gray-500 ml-2">
              (Задание: {assignmentData.title})
            </span>
          )}
        </h1>

        <div className="flex items-center space-x-2">
          {nextAssignment && (
            <Button
              variant="outline"
              onClick={() => navigateToAssignment(nextAssignment.id)}
            >
              Следующее задание
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}

          {nextBoard ? (
            <Button
              variant="outline"
              onClick={() => navigateToBoard(nextBoard.id)}
            >
              Следующая
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : whiteboardData?.assignmentId && !nextBoard ? (
            <Button variant="outline" onClick={createNewWhiteboard}>
              Создать страницу
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : null}
        </div>
      </header>

      <Whiteboard
        ref={whiteboardRef}
        whiteboardId={id}
        whiteboardTitle={whiteboardData?.title}
      />
    </div>
  );
}
