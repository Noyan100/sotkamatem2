// components/UserSolutionsList.tsx
"use client";

import React, { useEffect, useState } from "react";
import SolutionImagesViewer from "@/components/Solutions/SolutionImage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

type TaskSolutionWithTask = {
  id: number;
  userSolutionId: number;
  taskId: number;
  userAnswer: string;
  isCorrect: boolean;
  solvedAt: Date;
  timeSpent: number | null;
  createdAt: Date;
  task: {
    id: number;
    number: string;
    text: string;
    answer: string;
  };
};

type UserSolutionWithDetails = {
  id: number;
  userId: number;
  collectionId: number;
  startedAt: Date;
  finishedAt: Date | null;
  score: number | null;
  createdAt: Date;
  taskSolutions: TaskSolutionWithTask[];
  collection: {
    id: number;
    name: string;
  };
};

interface UserSolutionsListProps {
  userId: string;
  collectionId?: number; // Опциональный параметр для фильтрации по коллекции
}

const UserSolutionsList: React.FC<UserSolutionsListProps> = ({
  userId,
  collectionId,
}) => {
  const [solutions, setSolutions] = useState<UserSolutionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSolutions = async () => {
      try {
        setLoading(true);
        let url = `/api/solutions/user/${userId}`;
        if (collectionId) {
          url += `?collectionId=${collectionId}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch solutions");
        }
        const data = await response.json();

        // Обрабатываем случай, когда возвращается один объект вместо массива
        const solutionsArray = Array.isArray(data) ? data : [data];

        const formattedData = solutionsArray.map((solution: any) => ({
          ...solution,
          startedAt: new Date(solution.startedAt),
          finishedAt: solution.finishedAt
            ? new Date(solution.finishedAt)
            : null,
          createdAt: new Date(solution.createdAt),
          taskSolutions: solution.taskSolutions.map((ts: any) => ({
            ...ts,
            solvedAt: new Date(ts.solvedAt),
            createdAt: new Date(ts.createdAt),
          })),
        }));
        setSolutions(formattedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchSolutions();
  }, [userId, collectionId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Ошибка</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (solutions.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-gray-500 text-center">
          Ты пока не сделал ни одной попытки
          {collectionId ? " в этой коллекции" : ""}.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">
        Решения пользователя
        {collectionId && ` для выбранной коллекции`}
      </h2>
      <Accordion type="multiple" className="w-full space-y-4">
        {solutions.map((solution) => (
          <Card key={solution.id} className="overflow-hidden">
            <AccordionItem value={solution.id.toString()} className="border-0">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex flex-col items-start gap-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      Подборка: {solution.collection.name}
                    </span>
                    {solution.score !== null && (
                      <Badge variant="secondary">Баллы: {solution.score}</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span>Начато: {solution.startedAt.toLocaleString()}</span>
                    {solution.finishedAt && (
                      <span>
                        , Завершено: {solution.finishedAt.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0">
                <div className="mt-4 space-y-4">
                  <SolutionImagesViewer solutionId={solution.id} />

                  <div>
                    <h4 className="font-medium mb-2">Решенные задачи:</h4>
                    <div className="space-y-2">
                      {solution.taskSolutions &&
                      solution.taskSolutions.length > 0 ? (
                        solution.taskSolutions.map((taskSolution) => (
                          <Card key={taskSolution.id} className="p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex gap-2 mb-1">
                                  <div className="font-medium ">
                                    Задание #{taskSolution.task?.number}
                                  </div>{" "}
                                  <div className="text-blue-600">
                                    №{taskSolution.taskId}
                                  </div>
                                </div>
                                <p className="text-sm mt-1">
                                  Ответ: {taskSolution.userAnswer}
                                  {!taskSolution.isCorrect && (
                                    <span className="text-muted-foreground ml-2">
                                      (Правильный: {taskSolution.task.answer})
                                    </span>
                                  )}
                                </p>
                                {taskSolution.timeSpent && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Время решения: {taskSolution.timeSpent} сек
                                  </p>
                                )}
                              </div>
                              <Badge
                                variant={
                                  taskSolution.isCorrect
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {taskSolution.isCorrect
                                  ? "Правильно"
                                  : "Неправильно"}
                              </Badge>
                            </div>
                          </Card>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">
                          Нет решенных задач в этой попытке
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Card>
        ))}
      </Accordion>
    </div>
  );
};

export default UserSolutionsList;
