"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { ScrollArea } from "../ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { toast } from "sonner";

interface User {
  id: number;
  name: string;
  email: string;
}

interface Group {
  id: number;
  name: string;
}

export function AddUsersToGroup() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupsRes, usersRes] = await Promise.all([
          fetch("/api/groups"),
          fetch("/api/users"),
        ]);

        const groupsData = await groupsRes.json();
        const usersData = await usersRes.json();

        setGroups(groupsData);
        setUsers(usersData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Не удалось загрузить данные");
      }
    };

    fetchData();
  }, []);

  const handleUserToggle = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (!selectedGroup || selectedUsers.length === 0) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/groups/${selectedGroup}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIds: selectedUsers }),
      });

      if (response.ok) {
        toast.success("Пользователь(и) успешно добавлен(ы)");
        setSelectedUsers([]);
      } else {
        throw new Error("Failed to add users");
      }
    } catch (error) {
      console.error("Failed to add users:", error);
      toast.error("Не удалось добавить пользователей");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-[640px]">
      <CardHeader>
        <CardTitle>Добавить пользователей в группу</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group">Выберите группу</Label>
            <Select
              value={selectedGroup ? String(selectedGroup) : undefined}
              onValueChange={(value) => setSelectedGroup(Number(value))}
            >
              <SelectTrigger id="group" className="cursor-pointer">
                <SelectValue placeholder="-- Выберите группу --" />
              </SelectTrigger>
              <SelectContent className="cursor-pointer">
                {groups.map((group) => (
                  <SelectItem
                    key={group.id}
                    value={String(group.id)}
                    className="cursor-pointer"
                  >
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Выберите пользователей</Label>
            <ScrollArea className="h-60 rounded-md border p-2">
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-2 p-2 hover:bg-accent hover:text-accent-foreground rounded cursor-pointer"
                  >
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => handleUserToggle(user.id)}
                      className="cursor-pointer"
                    />
                    <label
                      htmlFor={`user-${user.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {user.name} ({user.email})
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!selectedGroup || selectedUsers.length === 0 || isLoading}
            className="w-[160px]"
          >
            {isLoading ? "Добавление..." : "Добавить в группу"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
