import React from "react";
import { signIn } from "next-auth/react";

interface Props {
  className?: string;
}
export const LoginEmail: React.FC<Props> = ({ className }) => {
  return (
    <button onClick={() => signIn("email")}>
      Войти или зарегистрироваться по почте
    </button>
  );
};
