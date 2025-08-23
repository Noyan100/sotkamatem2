"use client";

import React from "react";
import { signIn } from "next-auth/react";

interface Props {
  className?: string;
}
export const LoginYandex: React.FC<Props> = ({ className }) => {
  return (
    <div className="">
      <button onClick={() => signIn("yandex", { prompt: "select_account" })}>
        Войти через Яндекс
      </button>
    </div>
  );
};
