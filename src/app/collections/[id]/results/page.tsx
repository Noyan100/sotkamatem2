"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { NoMoney } from "@/components/NoMoney";
import { Navigation } from "@/components/navigation";
import { Container } from "@/components/container";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LatexText } from "@/components/LatextText";

type TaskSolution = {
  id: number;
  taskId: number;
  userAnswer: string;
  isCorrect: boolean;
  task: {
    id: number;
    number: number;
    text: string;
    answer: string;
    sources: any;
    image: any;
  };
};

type UserSolution = {
  id: number;
  score: number;
  taskSolutions: TaskSolution[];
};

export default function CollectionResultsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data: session, status } = useSession();
  const [solution, setSolution] = useState<UserSolution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectionName, setCollectionName] = useState("");

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

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!id || typeof id !== "string") {
        throw new Error("Invalid collection ID");
      }

      const response = await fetch(`/api/collections/${id}/results`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load results");
      }

      const data = await response.json();
      setSolution(data.solution);
      setCollectionName(data.collectionName || "Подборка");
    } catch (err) {
      console.error("Failed to fetch results:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      toast.error("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=/collections/${id}/results`);
    } else if (status === "authenticated") {
      fetchResults();
    }
  }, [status, id, router]);

  if (status === "loading" || loading) {
    return (
      <div className="bg-gray-200 min-h-screen">
        <Navigation />
        <Container>
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin h-8 w-8" />
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-200 min-h-screen">
        <Navigation />
        <Container>
          <Alert variant="destructive" className="mt-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button onClick={fetchResults} variant="outline" className="mt-4">
              Попробовать снова
            </Button>
          </Alert>
        </Container>
      </div>
    );
  }

  if (!solution) {
    return (
      <div className="bg-gray-200 min-h-screen">
        <Navigation />
        <Container>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Решений не найдено</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Для этой подборки нет сохраненных решений</p>
            </CardContent>
          </Card>
        </Container>
      </div>
    );
  }

  if (session?.user?.payment !== undefined && session.user.payment < 0) {
    return <NoMoney />;
  }

  return (
    <div className="bg-gray-200 min-h-screen">
      <Navigation />
      <Container>
        <Breadcrumb className="mt-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/collections">Подборки</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/collections/${id}`}>{collectionName}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Итоги решения</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="space-y-6 p-4 bg-white rounded-lg shadow-sm mt-4">
          <h1 className="text-2xl font-bold">Решения</h1>

          <Card className="p-6 gap-0 max-w-sm pl-0">
            <CardHeader>
              <CardTitle>Итог</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Общий балл</p>
                  <p className="text-xl font-semibold">
                    {solution.score} из {solution.taskSolutions.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Верных ответов</p>
                  <div className="text-xl font-semibold flex items-center gap-1">
                    {solution.taskSolutions.filter((ts) => ts.isCorrect).length}
                    <div className="text-sm text-gray-500 mt-[1px]">
                      (
                      {Math.round(
                        (solution.score / solution.taskSolutions.length) * 100
                      )}
                      %)
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Подробные результаты</h2>
            {solution.taskSolutions.map((taskSolution) => (
              <Card
                key={taskSolution.id}
                className={`p-6 gap-0 max-w-6xl pl-0 pr-0`}
              >
                <CardHeader>
                  <CardTitle>
                    <div className="flex gap-2 mb-1">
                      <div className="font-medium ">
                        Задание #{taskSolution.task.number}
                      </div>{" "}
                      <div className="text-blue-600">
                        №{taskSolution.task.id}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {taskSolution.task.text && (
                    <LatexText content={taskSolution.task.text} />
                  )}
                  {taskSolution.task.image && (
                    <img
                      src={taskSolution.task.image}
                      alt="Task illustration"
                      className="max-w-full h-auto rounded mt-4"
                      width="300px"
                    />
                  )}
                  <div className="mt-2 text-right text-sm text-gray-500 ">
                    Источники: {formatSources(taskSolution.task.sources)}
                  </div>

                  <div className="flex gap-12">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Ваш ответ
                      </p>
                      <p className="font-medium">{taskSolution.userAnswer}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Правильный ответ
                      </p>
                      <p className="font-medium">{taskSolution.task.answer}</p>
                    </div>
                    <div
                      className={`font-medium ml-auto mt-4 ${
                        taskSolution.isCorrect
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {taskSolution.isCorrect ? "Верно" : "Неверно"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
