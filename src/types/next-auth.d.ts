// types/next-auth.d.ts
import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    payment?: number;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      payment?: number;
      accessToken?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
    payment?: number;
    accessToken?: string;
  }
}