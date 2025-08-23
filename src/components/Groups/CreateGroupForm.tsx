"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

export function CreateGroupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.warning("Введите название группы");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      });

      if (response.ok) {
        toast.success("Группа успешно создана");
        router.refresh();
        setName("");
        setDescription("");
      } else {
        const error = await response.json();
        throw new Error(error.message || "Ошибка при создании группы");
      }
    } catch (error) {
      console.error("Failed to create group:", error);
      toast.error(
        error instanceof Error ? error.message : "Неизвестная ошибка"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-[640px]">
      <CardHeader>
        <CardTitle>Создать новую группу</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название группы</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название группы"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Описание (необязательно)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Добавьте описание группы"
              rows={3}
            />
          </div>
          <Button type="submit" className="w-[160px]" disabled={isSubmitting}>
            {isSubmitting ? "Создание..." : "Создать группу"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
