"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { ScrollArea } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";

interface User {
  id: number;
  name: string;
  email: string;
}

interface Collection {
  id: number;
  name: string;
  hasAccess: boolean;
}

export function UserAccessManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [loadingStates, setLoadingStates] = useState({
    users: true,
    collections: true,
    updating: false,
  });

  // Загрузка пользователей и коллекций
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [usersRes, collectionsRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/collections"),
        ]);

        const usersData = await usersRes.json();
        const collectionsData = await collectionsRes.json();

        setUsers(usersData || []);
        setCollections(
          (collectionsData || []).map((c: any) => ({
            ...c,
            hasAccess: false,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Не удалось загрузить данные");
        setUsers([]);
        setCollections([]);
      } finally {
        setLoadingStates((prev) => ({
          ...prev,
          users: false,
          collections: false,
        }));
      }
    };

    fetchInitialData();
  }, []);

  // Загрузка доступов пользователя при его выборе
  useEffect(() => {
    const fetchUserAccess = async () => {
      if (!selectedUser) {
        setCollections((prev) => prev.map((c) => ({ ...c, hasAccess: false })));
        return;
      }

      setLoadingStates((prev) => ({ ...prev, updating: true }));

      try {
        const response = await fetch(
          `/api/user-collections?userId=${selectedUser}`
        );
        const userCollections = await response.json();

        setCollections((prev) =>
          prev.map((collection) => ({
            ...collection,
            hasAccess: (userCollections || []).some(
              (uc: any) => uc.id === collection.id
            ),
          }))
        );
      } catch (error) {
        console.error("Failed to fetch user collections:", error);
        toast.error("Не удалось загрузить доступы пользователя");
      } finally {
        setLoadingStates((prev) => ({ ...prev, updating: false }));
      }
    };

    fetchUserAccess();
  }, [selectedUser]);

  const toggleAccess = async (collectionId: number) => {
    if (!selectedUser) {
      toast.warning("Выберите пользователя");
      return;
    }

    setLoadingStates((prev) => ({ ...prev, updating: true }));

    try {
      const collection = collections.find((c) => c.id === collectionId);
      const newAccessState = !(collection?.hasAccess || false);

      const response = await fetch(
        newAccessState ? "/api/grant-user-access" : "/api/revoke-user-access",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: Number(selectedUser),
            collectionId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Обновляем локальное состояние
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId ? { ...c, hasAccess: newAccessState } : c
        )
      );

      toast.success(
        newAccessState
          ? "Доступ к коллекции предоставлен"
          : "Доступ к коллекции отозван"
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Произошла ошибка при обновлении доступа"
      );
    } finally {
      setLoadingStates((prev) => ({ ...prev, updating: false }));
    }
  };

  if (loadingStates.users || loadingStates.collections) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 border-none shadow-none">
        <div className="flex flex-row gap-6">
          <div className="space-y-2 basis-1/3">
            <Label className="text-xl">Выберите пользователя</Label>
            <Select
              value={selectedUser}
              onValueChange={setSelectedUser}
              disabled={users.length === 0 || loadingStates.updating}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    users.length
                      ? "Выберите пользователя"
                      : "Нет доступных пользователей"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 basis-2/3">
            <Label className="text-xl">Управление доступом к коллекциям</Label>
            <ScrollArea className="h-64 rounded-md border p-2">
              {collections.length === 0 ? (
                <div className="text-muted-foreground py-2 text-center">
                  Нет доступных коллекций
                </div>
              ) : (
                <div className="space-y-2">
                  {collections.map((collection) => (
                    <div
                      key={collection.id}
                      className="flex items-center space-x-2 p-2 hover:bg-accent rounded"
                    >
                      <Checkbox
                        id={`collection-${collection.id}`}
                        checked={collection.hasAccess || false}
                        onCheckedChange={() => toggleAccess(collection.id)}
                        disabled={!selectedUser || loadingStates.updating}
                      />
                      <label
                        htmlFor={`collection-${collection.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {collection.name}
                        {collection.hasAccess && (
                          <span className="ml-2 text-xs text-green-600">
                            (доступ есть)
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </Card>
    </div>
  );
}
