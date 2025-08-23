"use client";

import React from "react";
import { User } from "lucide-react";
import { Container } from "./container";
import Link from "next/link";
import { useSession } from "next-auth/react";
import UserProfilePopover from "./Login/UserProfilePopover";

interface Props {
  className?: string;
}
export const Navigation: React.FC<Props> = ({ className }) => {
  const { data: session } = useSession();

  return (
    <div className="bg-white">
      <Container className="flex items-center justify-between py-6 ">
        <div className="flex items-center gap-5">
          {/* Левая часть */}
          <Link href="/tasks" className="ml-3">
            Банк заданий
          </Link>
          <Link href="/collections" className="ml-3">
            Подборки заданий
          </Link>
          {(session?.user as any)?.role === "ADMIN" && (
            <Link href="/groups" className="ml-3">
              Группы
            </Link>
          )}
          <Link href="/lessons" className="ml-3">
            Записи занятий
          </Link>
          {(session?.user as any)?.role === "ADMIN" && (
            <Link href="/users" className="ml-3">
              Пользователи
            </Link>
          )}
        </div>
        {/* Правая часть */}
        <div className="flex gap-3 items-center">
          {(session?.user as any)?.role === "ADMIN" && (
            <Link href="/whiteboard">Доска</Link>
          )}
          <UserProfilePopover />
        </div>
      </Container>
    </div>
  );
};
