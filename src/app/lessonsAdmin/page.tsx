"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AddLessonForm } from "@/components/Records/AddLessonForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AdminLessonsList } from "@/components/Records/AdminLessonsList";
import { Navigation } from "@/components/navigation";
import { Container } from "@/components/container";
import Link from "next/link";

export default function Page() {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  (session?.user as any)?.role !== "ADMIN" && redirect("/tasks");

  useEffect(() => {
    if (status === "loading") return; // Ждем загрузки сессии

    // Если пользователь не авторизован или у него нет роли ADMIN, перенаправляем
    if (!session || (session.user as any)?.role !== "ADMIN") {
      router.push("/lessons");
    }
  }, [session, status, router]);

  // Если сессия еще загружается или пользователь не ADMIN, показываем пустой div
  if (
    status === "loading" ||
    !session ||
    (session.user as any)?.role !== "ADMIN"
  ) {
    return <div></div>;
  }

  return (
    <div className="bg-gray-200 min-h-screen">
      <Navigation />
      <Container className="p-3">
        <div className="text-2xl font-bold mb-4">Админ-панель</div>
        <AdminLessonsList />
        <div className="flex items-center justify-center gap-6 mt-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-[300px] h-[44px]">Добавить запись</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Добавить новую видео-лекцию</DialogTitle>
              </DialogHeader>
              <AddLessonForm onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
          <Link href="/lessons" className="flex items-center justify-center">
            <Button className="w-[300px] h-[44px]">Обратно</Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}
