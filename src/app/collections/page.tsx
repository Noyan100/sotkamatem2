"use client";

import { CollectionList } from "@/components/Collections/CollectionList";
import { Container } from "@/components/container";
import { Navigation } from "@/components/navigation";
import { NoMAuth } from "@/components/NoAuth";
import { NoMoney } from "@/components/NoMoney";
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
        <CollectionList />
      </Container>
    </div>
  );
}
