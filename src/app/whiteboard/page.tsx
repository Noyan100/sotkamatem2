"use client";

import { Container } from "@/components/container";
import { Navigation } from "@/components/navigation";
import CollectionAssignmentsList from "@/components/Whiteboard/CollectionAssignmentsList";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();
  (session?.user as any)?.role !== "ADMIN" && redirect("/tasks");
  return (
    <div className="bg-gray-200 min-h-screen">
      <Navigation />
      <Container>
        <h1 className="text-2xl font-bold mb-4 mt-4">Подборки заданий</h1>
        <CollectionAssignmentsList />
      </Container>
    </div>
  );
}
