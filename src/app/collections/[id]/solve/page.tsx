"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { ImageUploader } from "@/components/Solutions/ImageUploader";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LatexText } from "@/components/LatextText";
import { Input } from "@/components/ui/input";

type Task = {
  id: number;
  text: string;
  answer: string;
  number: number;
  sources: any;
  image: any;
};

type CollectionWithTasks = {
  id: number;
  name: string;
  description?: string;
  tasks: Task[];
};

// Ключи для localStorage
const getStorageKeys = () => {
  if (typeof window === "undefined")
    return { ANSWERS: "", SOLUTION_IMAGES: "" };

  return {
    ANSWERS: `collection_${window.location.pathname}_answers`,
    SOLUTION_IMAGES: `collection_${window.location.pathname}_solution_images`,
  };
};

export default function CollectionSolvePage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const collectionId = params?.id as string;

  const [collection, setCollection] = useState<CollectionWithTasks | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [solutionImages, setSolutionImages] = useState<
    Record<number, string[]>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Загрузка сохраненных данных из localStorage
  const loadSavedData = () => {
    if (typeof window === "undefined") return { answers: {}, images: {} };

    try {
      const STORAGE_KEYS = getStorageKeys();
      const savedAnswers = localStorage.getItem(STORAGE_KEYS.ANSWERS);
      const savedSolutionImages = localStorage.getItem(
        STORAGE_KEYS.SOLUTION_IMAGES
      );

      return {
        answers: savedAnswers ? JSON.parse(savedAnswers) : {},
        images: savedSolutionImages ? JSON.parse(savedSolutionImages) : {},
      };
    } catch (error) {
      console.error("Error loading saved data:", error);
      // Очищаем невалидные данные
      const STORAGE_KEYS = getStorageKeys();
      localStorage.removeItem(STORAGE_KEYS.ANSWERS);
      localStorage.removeItem(STORAGE_KEYS.SOLUTION_IMAGES);
      return { answers: {}, images: {} };
    }
  };

  // Сохранение ответов в localStorage
  const saveAnswersToStorage = (answers: Record<number, string>) => {
    if (typeof window === "undefined") return;

    try {
      const STORAGE_KEYS = getStorageKeys();
      localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(answers));
    } catch (error) {
      console.error("Error saving answers:", error);
    }
  };

  // Сохранение изображений в localStorage
  const saveSolutionImagesToStorage = (images: Record<number, string[]>) => {
    if (typeof window === "undefined") return;

    try {
      const STORAGE_KEYS = getStorageKeys();
      localStorage.setItem(
        STORAGE_KEYS.SOLUTION_IMAGES,
        JSON.stringify(images)
      );
    } catch (error) {
      console.error("Error saving solution images:", error);
    }
  };

  // Очистка сохраненных данных после успешной отправки
  const clearSavedData = () => {
    if (typeof window === "undefined") return;

    const STORAGE_KEYS = getStorageKeys();
    localStorage.removeItem(STORAGE_KEYS.ANSWERS);
    localStorage.removeItem(STORAGE_KEYS.SOLUTION_IMAGES);
  };

  // Проверка авторизации
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(
        `/auth/signin?callbackUrl=/collections/${collectionId}/solve`
      );
    }
  }, [status, router, collectionId]);

  // Загрузка подборки
  const fetchCollection = async () => {
    try {
      setLoading(true);
      const numericId = parseInt(collectionId);
      const response = await fetch(`/api/collections/${numericId}/solve`);

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setCollection(data);

      // Загружаем сохраненные данные
      const savedData = loadSavedData();

      // Инициализация состояний для ответов
      const initialAnswers = data.tasks.reduce(
        (acc: Record<number, string>, task: Task) => {
          // Используем сохраненный ответ или пустую строку
          acc[task.id] = savedData.answers[task.id] || "";
          return acc;
        },
        {}
      );

      setAnswers(initialAnswers);
      setSolutionImages(savedData.images);
      setDataLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
      toast.error("Ошибка загрузки подборки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && collectionId) {
      fetchCollection();
    }
  }, [status, collectionId]);

  // Сохранение ответов при изменении
  useEffect(() => {
    if (dataLoaded && Object.keys(answers).length > 0) {
      saveAnswersToStorage(answers);
    }
  }, [answers, dataLoaded]);

  // Сохранение изображений при изменении
  useEffect(() => {
    if (dataLoaded && Object.keys(solutionImages).length > 0) {
      saveSolutionImagesToStorage(solutionImages);
    }
  }, [solutionImages, dataLoaded]);

  // Обработчики изменений
  const handleAnswerChange = (taskId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [taskId]: answer }));
  };

  const handleImageUpload = (taskId: number, filePaths: string[]) => {
    setSolutionImages((prev) => ({
      ...prev,
      [taskId]: filePaths,
    }));
  };

  const formatSources = (sources: any): string => {
    if (!sources) return "Не указаны";

    if (typeof sources === "string") return sources;

    if (!Array.isArray(sources)) {
      return JSON.stringify(sources);
    }

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

    const fipiStrings = fipiSources.map((source) => {
      return `${source.sourceType}${
        source.name ? `: ${source.name}` : ""
      }`.trim();
    });

    const mathegeStrings = mathegeSources.map((source) => {
      return `${source.sourceType}${
        source.name ? `: ${source.name}` : ""
      }`.trim();
    });

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

    const allSources = [
      ...fipiStrings,
      ...mathegeStrings,
      ...waveStrings,
      ...otherStrings,
    ];

    return allSources.join(", ");
  };

  const handleImageRemove = (taskId: number, index: number) => {
    setSolutionImages((prev) => {
      const updatedImages = { ...prev };
      if (updatedImages[taskId]) {
        updatedImages[taskId] = updatedImages[taskId].filter(
          (_, i) => i !== index
        );
        if (updatedImages[taskId].length === 0) {
          delete updatedImages[taskId];
        }
      }
      return updatedImages;
    });
  };

  // Отправка решений
  const handleSubmit = async () => {
    if (!session?.user?.email || !collection) return;

    try {
      setIsSubmitting(true);

      const solutions = collection.tasks.map((task) => ({
        taskId: task.id,
        answer: answers[task.id] || "",
        images: solutionImages[task.id] || [],
      }));

      const response = await fetch(`/api/collections/${collection.id}/solve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solutions,
          userEmail: session.user.email,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Очищаем сохраненные данные после успешной отправки
      clearSavedData();

      toast.success("Решения успешно отправлены!");
      router.push(`/collections/${collection.id}/results`);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(
        error instanceof Error ? error.message : "Ошибка при отправке решений"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (session?.user?.payment !== undefined && session.user.payment < 0) {
    return <NoMoney />;
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
            <Button
              onClick={fetchCollection}
              variant="outline"
              className="mt-4"
            >
              Попробовать снова
            </Button>
          </Alert>
        </Container>
      </div>
    );
  }

  if (loading || !dataLoaded) {
    return (
      <div className="bg-gray-200 min-h-screen">
        <Navigation />
        <Container>
          <div className="space-y-6 p-4 bg-white rounded mt-4">
            <Skeleton className="h-8 w-1/3 mb-4" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-4">
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="bg-gray-200 min-h-screen">
        <Navigation />
        <Container>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Подборка не найдена</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Не удалось загрузить подборку</p>
            </CardContent>
          </Card>
        </Container>
      </div>
    );
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
                <Link href={`/collections/${collection.id}`}>
                  {collection.name}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Решение подборки</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="space-y-6 p-4 bg-white rounded-lg shadow-sm mt-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{collection.name}</h1>
            {collection.description && (
              <p className="text-gray-600">{collection.description}</p>
            )}
          </div>

          <div className="space-y-6">
            {collection.tasks.map((task, index) => (
              <Card key={task.id} className="p-4 gap-1">
                <div className="flex gap-2 mb-1">
                  <div className="font-medium ">Задание №{index + 1}</div>{" "}
                  <div className="text-blue-600">#{task.number}</div>
                </div>
                {task.text && <LatexText content={task.text} />}
                {task.image && (
                  <img
                    src={task.image}
                    alt="Task illustration"
                    className="max-w-full h-auto rounded mt-4"
                    width="300px"
                  />
                )}
                <div className="mt-2 text-right text-sm text-gray-500 ">
                  Источники: {formatSources(task.sources)}
                </div>

                <hr className=" mt-4 mb-4" />
                <div className="space-y-2">
                  <Input
                    value={answers[task.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(task.id, e.target.value)
                    }
                    className="min-h-[20px] max-w-sm"
                    placeholder="Введите ваш ответ..."
                  />
                </div>

                <div className="space-y-2 mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Загрузить решение (опционально)
                  </label>
                  <ImageUploader
                    taskId={task.id}
                    onUpload={(filePaths) =>
                      handleImageUpload(task.id, filePaths)
                    }
                    onRemove={(index) => handleImageRemove(task.id, index)}
                    existingImages={solutionImages[task.id] || []}
                    maxFiles={3}
                  />
                </div>
              </Card>
            ))}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting && <Loader2 className="animate-spin h-5 w-5 mr-2" />}
            Отправить решения
          </Button>
        </div>
      </Container>
    </div>
  );
}
