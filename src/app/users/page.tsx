"use client";

import UserBalanceManager from "@/components/Balance/UserBalanceManager";
import { Container } from "@/components/container";
import { Navigation } from "@/components/navigation";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function Page() {
  const { data: session, status } = useSession();
  (session?.user as any)?.role !== "ADMIN" && redirect("/tasks");
  return (
    <div className="bg-gray-200 min-h-screen">
      <Navigation />
      <Container>
        <UserBalanceManager />
      </Container>
    </div>
  );
}
