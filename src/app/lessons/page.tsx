"use client";

import { NoMAuth } from "@/components/NoAuth";
import { NoMoney } from "@/components/NoMoney";
import { UserLessonsList } from "@/components/Records/UserLessonsList";
import { Container } from "@/components/container";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Page() {
  const { data: session } = useSession();

  if (session?.user?.payment !== undefined && session.user.payment < 0) {
    return <NoMoney />;
  }
  if (!session?.user) {
    return <NoMAuth />;
  }
  return (
    <div className="bg-gray-200 min-h-screen">
      <Navigation />
      <Container className="p-3">
        <div className="text-2xl font-bold mb-4">Записи занятий</div>
        <UserLessonsList />
        {(session?.user as any)?.role === "ADMIN" && (
          <Link
            href="/lessonsAdmin"
            className="flex items-center justify-center mt-4"
          >
            <Button className="w-[300px] h-[44px]">Админ-панель</Button>
          </Link>
        )}
      </Container>
    </div>
  );
}
