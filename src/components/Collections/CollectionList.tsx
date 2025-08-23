"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export const CollectionList = () => {
  const router = useRouter();
  const [collections, setCollections] = useState<any[]>([]);
  const [userSolutions, setUserSolutions] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError(null);

      if (status !== "authenticated" || !session?.user?.id) {
        setCollections([]);
        return;
      }

      if (session.user.payment !== undefined && session.user.payment < 0) {
        setCollections([]);
        return;
      }

      const [collectionsResponse, solutionsResponse] = await Promise.all([
        fetch(`/api/collections?userId=${session.user.id}`),
        fetch(`/api/solutions?userId=${session.user.id}`),
      ]);

      if (!collectionsResponse.ok || !solutionsResponse.ok) {
        const errorData = await collectionsResponse.json().catch(() => ({}));
        const solutionsError = await solutionsResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            solutionsError.error ||
            "Failed to fetch collections or solutions"
        );
      }

      const collectionsData = await collectionsResponse.json();
      const solutionsData = await solutionsResponse.json();

      // Create a map of collectionId to user solution
      const solutionsMap = solutionsData.reduce((acc: any, solution: any) => {
        acc[solution.collectionId] = solution;
        return acc;
      }, {});

      setCollections(collectionsData);
      setUserSolutions(solutionsMap);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message);
      toast.error("Не удалось загрузить подборки", {
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteCollection = async (collectionId: number) => {
    try {
      setDeletingId(collectionId);
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete collection");
      }

      toast.success("Подборка удалена", {
        description: "Подборка заданий была успешно удалена",
      });
      setCollections(collections.filter((c) => c.id !== collectionId));
      // Remove from solutions if exists
      setUserSolutions((prev) => {
        const newSolutions = { ...prev };
        delete newSolutions[collectionId];
        return newSolutions;
      });
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error("Ошибка при удалении подборки", {
        description: err.message,
      });
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [status]);

  const handleCollectionClick = (collectionId: string) => {
    router.push(`/collections/${collectionId}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-[200px]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Ошибка</AlertTitle>
        <AlertDescription>
          {error}
          <Button variant="outline" className="mt-2" onClick={fetchCollections}>
            Попробовать снова
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold mt-4">Подборки заданий</h2>
      </div>

      {collections.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Твоих подборок не найдено.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map(
            (collection) =>
              collection.tasks?.length !== 0 && (
                <Card
                  key={collection.id}
                  className="hover:shadow-md transition-shadow cursor-pointer relative"
                  onClick={() => handleCollectionClick(collection.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold">{collection.name}</h3>
                      {(session?.user as any)?.role === "ADMIN" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-red-100 hover:text-red-600 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCollection(collection.id);
                          }}
                          disabled={deletingId === collection.id}
                        >
                          {deletingId === collection.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 flex justify-between items-baseline">
                    <Badge variant="outline" className="pl-4 pr-4 pt-2 pb-2">
                      {collection.tasks?.length || 0} заданий
                    </Badge>

                    {userSolutions[collection.id] ? (
                      <div className="text-sm flex gap-[6px]">
                        <div className="text-muted-foreground">Баллы: </div>
                        <div className="font-medium text-blue-600">
                          {userSolutions[collection.id].score ?? 0}/
                          {collection.tasks?.length ?? 0}
                        </div>
                      </div>
                    ) : (
                      <div className="text-red-600">Нет решений</div>
                    )}
                  </CardContent>
                </Card>
              )
          )}
        </div>
      )}
    </div>
  );
};
