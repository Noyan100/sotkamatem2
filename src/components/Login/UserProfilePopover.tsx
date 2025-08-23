"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function UserProfilePopover() {
  const { data: session, status } = useSession();

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full cursor-pointer"
        >
          <Avatar className="h-8 w-8">
            {session?.user?.image ? (
              <AvatarImage src={session.user.image} />
            ) : (
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {status === "loading" ? (
          <Card className="border-0">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ) : !session ? (
          <Card className="border-0">
            <CardHeader>
              <CardTitle>Вход в систему</CardTitle>
              <CardDescription>Авторизуйтесь для доступа</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => signIn("google")}
                  className="flex items-center justify-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                    <path fill="none" d="M1 1h22v22H1z" />
                  </svg>
                  <span>Google</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => signIn("yandex")}
                  className="flex items-center justify-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                  >
                    <path
                      fill="#FC3F1D"
                      d="M2.04 12c0-5.523 4.476-10 10-10 5.522 0 10 4.477 10 10s-4.478 10-10 10c-5.524 0-10-4.477-10-10z"
                    />
                    <path
                      fill="#FFF"
                      d="M13.32 7.666h-.924c-1.694 0-2.585.858-2.585 2.123 0 1.43.616 2.1 1.881 2.959l1.045.704-3.003 4.487H7.49l2.695-4.014c-1.55-1.111-2.42-2.19-2.42-4.015 0-2.288 1.595-3.85 4.62-3.85h3.003v11.868H13.32V7.666z"
                    />
                  </svg>
                  <span>Яндекс</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0">
            <CardHeader className="flex flex-row items-center space-x-4">
              <Avatar>
                {session.user.image ? (
                  <AvatarImage src={session.user.image} />
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <CardTitle>{session.user.name || "Пользователь"}</CardTitle>
                <CardDescription>{session.user.email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium">Баланс:</span>
                <span className="font-bold">
                  {session.user.payment || 0} руб.
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => signOut()}>
                Выйти
              </Button>
            </CardFooter>
          </Card>
        )}
      </PopoverContent>
    </Popover>
  );
}
