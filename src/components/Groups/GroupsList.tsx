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
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";

interface GroupWithMembers {
  id: number;
  name: string;
  description: string | null;
  members: {
    user: {
      id: number;
      name: string;
      email: string;
    };
  }[];
}

interface Collection {
  id: number;
  name: string;
}

export function GroupsList() {
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [loadingStates, setLoadingStates] = useState({
    groups: true,
    collections: true,
    sharing: false,
  });

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch("/api/groups");
        const data = await res.json();
        setGroups(data);
      } catch (error) {
        console.error("Failed to fetch groups:", error);
        toast.error("Не удалось загрузить группы");
      } finally {
        setLoadingStates((prev) => ({ ...prev, groups: false }));
      }
    };

    const fetchCollections = async () => {
      try {
        const res = await fetch("/api/collections");
        const data = await res.json();
        setCollections(data);
      } catch (error) {
        console.error("Failed to fetch collections:", error);
        toast.error("Не удалось загрузить коллекции");
      } finally {
        setLoadingStates((prev) => ({ ...prev, collections: false }));
      }
    };

    fetchGroups();
    fetchCollections();
  }, []);

  const shareCollectionWithGroup = async (groupId: number) => {
    if (!selectedCollection) {
      toast.warning("Пожалуйста, выберите коллекцию");
      return;
    }

    setLoadingStates((prev) => ({ ...prev, sharing: true }));

    try {
      const response = await fetch("/api/share-collection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupId,
          collectionId: Number(selectedCollection),
        }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Ошибка сервера");

      toast.success(result.message || "Доступ успешно предоставлен");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Неизвестная ошибка"
      );
    } finally {
      setLoadingStates((prev) => ({ ...prev, sharing: false }));
    }
  };

  if (loadingStates.groups || loadingStates.collections) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Управление доступом */}
      <Card>
        <CardHeader>
          <CardTitle>Управление доступом</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collection-select">Выберите коллекцию</Label>
              <Select
                value={selectedCollection}
                onValueChange={setSelectedCollection}
                disabled={collections.length === 0}
              >
                <SelectTrigger id="collection-select">
                  <SelectValue
                    placeholder={
                      collections.length
                        ? "Выберите коллекцию"
                        : "Нет доступных коллекций"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {collections.map((collection) => (
                    <SelectItem
                      key={collection.id}
                      value={String(collection.id)}
                      className="cursor-pointer"
                    >
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список групп */}
      <div className="space-y-4">
        <h1 className="pl-1 text-xl font-medium">Выберите группу</h1>
        {groups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Нет доступных групп
          </div>
        ) : (
          groups.map((group) => (
            <Card key={group.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{group.name}</h3>
                    {group.description && (
                      <p className="text-muted-foreground mb-2">
                        {group.description}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Участников: {group.members.length}
                    </p>
                  </div>
                  <Button
                    variant="white"
                    size="sm"
                    onClick={() =>
                      setExpandedGroup(
                        expandedGroup === group.id ? null : group.id
                      )
                    }
                  >
                    {expandedGroup === group.id ? "Свернуть" : "Подробнее"}
                  </Button>
                </div>
              </CardHeader>

              {expandedGroup === group.id && (
                <CardContent className="pt-0 border-t">
                  <h4 className="font-medium mb-3 mt-2">Участники:</h4>
                  <ScrollArea className="mb-4">
                    <ul className="space-y-3">
                      {group.members.map((member) => (
                        <li key={member.user.id} className="flex items-center">
                          <Avatar className="h-9 w-9 mr-3">
                            <AvatarFallback>
                              {member.user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.user.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {member.user.email}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>

                  <Button
                    onClick={() => shareCollectionWithGroup(group.id)}
                    disabled={loadingStates.sharing || !selectedCollection}
                    className="w-full sm:w-auto"
                  >
                    {loadingStates.sharing
                      ? "Обработка..."
                      : "Дать доступ к коллекции"}
                  </Button>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
