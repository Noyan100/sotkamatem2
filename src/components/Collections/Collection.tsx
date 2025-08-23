"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LatexText } from "@/components/LatextText";
import { Container } from "../container";

interface Task {
  id: number;
  number: string;
  text: string;
  image?: string;
  videoSrc?: string;
  answer: string;
  solution: string;
  type?: string;
}

interface CollectionTask {
  id: string;
  taskId: number;
  order: number | null;
  task?: Task;
}

interface Collection {
  id: number;
  name: string;
  tasks?: CollectionTask[];
}

export default function Collection() {
  const params = useParams();
  const id = params?.id as string;
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchCollection = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!id) {
        throw new Error("Collection ID is missing");
      }

      const response = await fetch(`/api/collections/${id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || errorData.message || "Failed to fetch collection"
        );
      }

      const data = await response.json();
      setCollection(data);
    } catch (err) {
      console.error("Fetch error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      toast.error("Failed to load collection", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTask = async (taskId: number) => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCollection();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchCollection}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!collection) {
    return <div className="text-center py-8">Collection not found</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">{collection.name}</h1>

      <div className="">
        {/* Список задач в подборке */}
        <Container>
          <div className="md:col-span-1 space-y-4">
            <h2 className="text-xl font-semibold">Задания в подборке</h2>

            {!collection.tasks || collection.tasks.length === 0 ? (
              <p className="text-gray-500">Нет заданий в подборке</p>
            ) : (
              <ul className="space-y-2">
                {collection.tasks.map((collectionTask) => (
                  <li
                    key={`${collectionTask.taskId}-${collectionTask.order}`}
                    className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      selectedTask?.id === collectionTask.taskId
                        ? "bg-blue-50 border-blue-200"
                        : ""
                    }`}
                    onClick={() =>
                      collectionTask.task && fetchTask(collectionTask.taskId)
                    }
                  >
                    <h3 className="font-medium">
                      {collectionTask.task?.number ||
                        `Task ${collectionTask.taskId}`}
                    </h3>
                    <LatexText content={collectionTask.task?.text} />
                    <img
                      src={collectionTask.task?.image}
                      alt="Task illustration"
                      className="max-w-full h-auto rounded"
                      width="300px"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Container>
      </div>
    </div>
  );
}
