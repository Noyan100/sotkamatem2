"use client";

import { GroupsList } from "@/components/Groups/GroupsList";
import { CreateGroupForm } from "@/components/Groups/CreateGroupForm";
import { AddUsersToGroup } from "@/components/Groups/AddUsersToGroup";
import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { UserAccessManager } from "@/components/Users/UserAccessManager";
import { Container } from "@/components/container";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function GroupsPage() {
  const [activeTab, setActiveTab] = useState<"list" | "create" | "add-users">(
    "list"
  );
  const { data: session, status } = useSession();
  (session?.user as any)?.role !== "ADMIN" && redirect("/tasks");

  return (
    <div className="bg-gray-200 min-h-screen">
      <Navigation />
      <Container className="container mx-auto mt-4">
        <h1 className="text-2xl font-bold mb-4">
          Управление группами (Пользователи)
        </h1>

        <div className="bg-white p-6 rounded">
          <UserAccessManager />
        </div>
        <Link
          href="/groups"
          className="flex items-center justify-center mt-4 pb-4"
        >
          <Button className="w-[300px] h-[44px]">Управление группами</Button>
        </Link>
      </Container>
    </div>
  );
}
