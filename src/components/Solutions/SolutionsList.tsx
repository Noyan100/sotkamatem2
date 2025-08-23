// components/SolutionsList.tsx
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
import { Terminal, Trash2 } from "lucide-react";
import { LatexText } from "../LatextText";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  user: {
    id: number;
    name: string;
    email: string;
  };
  taskSolutions: TaskSolutionWithTask[];
  collection: {
    id: number;
    name: string;
  };
};

interface SolutionsListProps {
  collectionId: number;
}

const SolutionsList: React.FC<SolutionsListProps> = ({ collectionId }) => {
  const [solutions, setSolutions] = useState<UserSolutionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchSolutions();
  }, [collectionId]);

  const fetchSolutions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/solutions/collections/${collectionId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch solutions");
      }
      const data = await response.json();
      const formattedData = data.map((solution: any) => ({
        ...solution,
        startedAt: new Date(solution.startedAt),
        finishedAt: solution.finishedAt ? new Date(solution.finishedAt) : null,
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

  const handleDeleteSolution = async (solutionId: number) => {
    try {
      setDeletingId(solutionId);

      toast.promise(
        async () => {
          const response = await fetch(`/api/solutions/${solutionId}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            throw new Error("Не удалось удалить решение");
          }

          setSolutions(
            solutions.filter((solution) => solution.id !== solutionId)
          );
          return solutionId;
        },
        {
          loading: "Удаление решения...",
          success: (id) => `Решение #${id} успешно удалено`,
          error: (error) => error.message || "Произошла ошибка при удалении",
        }
      );
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setDeletingId(null);
    }
  };

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
          Пока нет решений для этой коллекции.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Решения пользователей</h2>
      <Accordion type="multiple" className="w-full space-y-4">
        {solutions.map((solution) => (
          <Card key={solution.id} className="overflow-hidden">
            <AccordionItem value={solution.id.toString()} className="border-0">
              <div className="flex items-center justify-between px-4 py-3">
                <AccordionTrigger className="hover:no-underline flex-1 [&>[data-chevron]]:ml-2">
                  <div className="flex flex-col items-start gap-1 flex-1 text-left">
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-medium">{solution.user.name}</span>
                      <Badge variant="outline">{solution.user.email}</Badge>
                      {solution.score !== null && (
                        <Badge variant="secondary">
                          Баллы: {solution.score}
                        </Badge>
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 ml-2"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteSolution(solution.id);
                  }}
                  disabled={deletingId === solution.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <AccordionContent className="px-4 pb-4 pt-0">
                <div className="mt-4 space-y-4">
                  <SolutionImagesViewer solutionId={solution.id} />

                  <div>
                    <h4 className="font-medium mb-2">Решенные задачи:</h4>
                    <div className="space-y-2">
                      {solution.taskSolutions.map((taskSolution) => (
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
                              <div className="text-sm mt-1 flex">
                                <div className="flex gap-1">
                                  Ответ:
                                  <LatexText
                                    content={taskSolution.userAnswer}
                                  />
                                </div>
                                {!taskSolution.isCorrect && (
                                  <div className="text-muted-foreground ml-2 flex">
                                    (Правильный:
                                    <div className="ml-1">
                                      <LatexText
                                        content={taskSolution.task.answer}
                                      />
                                    </div>
                                    )
                                  </div>
                                )}
                              </div>
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
                      ))}
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

export default SolutionsList;
