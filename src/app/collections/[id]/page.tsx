"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { TaskList } from "@/components/Collections/TaskList";
import { Collection } from "@/types/types";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Navigation } from "@/components/navigation";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SolutionsList from "@/components/Solutions/SolutionsList";
import UserSolutionsList from "@/components/Solutions/UserSolutionsList";
import { NoMoney } from "@/components/NoMoney";
import { Container } from "@/components/container";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function CollectionPage() {
  const params = useParams();
  const id = params?.id as string;
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [boardTitle, setBoardTitle] = useState("");
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);

  if (session?.user?.payment !== undefined && session.user.payment < 0) {
    return <NoMoney />;
  }

  const router = useRouter();

  const handleStartOnBoard = () => {
    if (!collection) {
      toast.error("Collection is not loaded");
      return;
    }
    setIsDialogOpen(true);
  };

  const handleCreateBoard = async () => {
    try {
      if (!collection || !id) {
        toast.error("Collection is not loaded");
        return;
      }

      if (!boardTitle.trim()) {
        toast.error("Please enter a title for the board");
        return;
      }

      setIsCreatingBoard(true);

      const response = await fetch("/api/board/create-from-collection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collectionId: id,
          title: boardTitle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to create board assignment"
        );
      }

      if (!data.firstWhiteboardId) {
        throw new Error("Failed to create whiteboard");
      }

      router.push(`/whiteboard`);
    } catch (err) {
      console.error("Error creating board assignment:", err);
      toast.error("Failed to create board assignment", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsCreatingBoard(false);
      setIsDialogOpen(false);
    }
  };

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

      const data: Collection = await response.json();
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

  useEffect(() => {
    if (id) fetchCollection();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-gray-200 min-h-screen">
        <Navigation />
        <Container>
          <div className="space-y-6 p-4 bg-white rounded mt-4">
            <Skeleton className="h-8 w-1/3 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/4" />
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-48" />
              </div>
            </div>
            <div className="mt-8">
              <Skeleton className="h-64 w-full" />
            </div>
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
            <Button
              onClick={fetchCollection}
              variant="outline"
              className="mt-4"
            >
              Retry
            </Button>
          </Alert>
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
              <CardTitle>Collection not found</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Подборок не найдено</p>
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
              <BreadcrumbLink>{collection.name}</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="space-y-6 p-4 bg-white rounded-lg shadow-sm mt-4">
          <h1 className="text-2xl font-bold tracking-tight">
            {collection.name}
          </h1>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Задания в подборке</h2>
            <TaskList tasks={collection.tasks || []} />
            <div className="flex gap-4">
              {status === "authenticated" ? (
                <>
                  <Link href={`/collections/${id}/solve`} className="">
                    <Button>Начать решать подборку</Button>
                  </Link>
                  {(session?.user as any)?.role === "ADMIN" && (
                    <Button
                      onClick={handleStartOnBoard}
                      variant="white"
                      className="cursor-pointer"
                    >
                      Начать решать на доске
                    </Button>
                  )}
                </>
              ) : (
                <Link
                  href={`/auth/signin?callbackUrl=/collections/${id}`}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  Войдите, чтобы начать решать
                </Link>
              )}
            </div>
          </div>

          <div className="mt-8">
            {(session?.user as any)?.role === "ADMIN" ? (
              <SolutionsList collectionId={Number(id)} />
            ) : status === "authenticated" ? (
              <UserSolutionsList
                userId={session.user.id}
                collectionId={Number(id)}
              />
            ) : (
              <Card className="p-4">
                <p className="text-gray-500 text-center">
                  Войдите, чтобы увидеть свои решения
                </p>
              </Card>
            )}
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать доску для подборки</DialogTitle>
                <DialogDescription>
                  Введите название для вашей новой доски
                </DialogDescription>
              </DialogHeader>
              <Input
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                placeholder="Название доски"
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isCreatingBoard}
                >
                  Отмена
                </Button>
                <Button onClick={handleCreateBoard} disabled={isCreatingBoard}>
                  {isCreatingBoard ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    "Создать доску"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Container>
    </div>
  );
}
