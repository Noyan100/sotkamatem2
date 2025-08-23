"use client";

import { Container } from "@/components/container";
import { Navigation } from "@/components/navigation";
import { NoMAuth } from "@/components/NoAuth";
import { NoMoney } from "@/components/NoMoney";
import { AddTask } from "@/components/Tasks/addTask";
import { Filters } from "@/components/Tasks/filters";
import { TaskList } from "@/components/Tasks/taskList";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  if (session?.user?.payment !== undefined && session.user.payment < 0) {
    return <NoMoney />;
  }

  if (!session?.user) {
    return <NoMAuth />;
  }

  return (
    <div className="bg-gray-200 min-h-screen">
      <Navigation />
      <Container>
        <div className="text-2xl font-bold mb-4 mt-4">Банк заданий</div>
        <div className="bg-white p-6 rounded">
          <Filters />
          {(session?.user as any)?.role === "ADMIN" && <AddTask />}
          <TaskList />
        </div>
      </Container>
    </div>
  );
}
