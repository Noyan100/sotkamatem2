"use client";

import { SessionProvider } from "next-auth/react";
import { CollectionProvider } from "./Tasks/collectionContext";

import React from "react";

interface Props {
  className?: string;
  children: React.ReactNode;
}
export const Providers: React.FC<Props> = ({ className, children }) => {
  return (
    <SessionProvider>
      <CollectionProvider>{children}</CollectionProvider>
    </SessionProvider>
  );
};
