import NextAuth, { type NextAuthOptions } from "next-auth";
import YandexProvider from "next-auth/providers/yandex";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    YandexProvider({
      clientId: process.env.YANDEX_CLIENT_ID ?? "",
      clientSecret: process.env.YANDEX_CLIENT_SECRET ?? "",
      authorization: {
        url: "https://oauth.yandex.ru/authorize",
        params: { response_type: "code", scope: "", prompt: " " },
      },
      async profile(profile: any) {
        return {
          id: profile.id,
          name: profile.real_name,
          email: profile.default_email,
          image: null,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;
      
      try {
        const existingUser = await prisma.user.findFirst({ 
          where: { email: user.email } 
        });
        
        if (!existingUser) {
          await prisma.user.create({
            data: {
              name: user.name ?? profile?.name ?? "No name",
              email: user.email,
              payment: -1,
              password: "",
            },
          });
        }
        return true;
      } catch (error) {
        console.error("SignIn error:", error);
        return false;
      }
    },
    
    
  async session({ session, token }) {
    if (session.user?.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          name: true,
          email: true,
          payment: true,
          role: true
        }
      });
      
      if (dbUser) {
        return {
          ...session,
          user: {
            ...session.user,
            id: dbUser.id.toString(),
            name: dbUser.name || session.user.name,
            email: dbUser.email || session.user.email,
            role: dbUser.role || undefined,
            payment: dbUser.payment || undefined,
            accessToken: token.accessToken
          }
        };
      }
    }
    return session;
  },
    
    async jwt({ token, user, account }) {
      // Передаем данные пользователя в токен
      if (user) {
        token.id = user.id.toString(); // Преобразуем number в string
      }
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: "jwt",
  },
};

export default NextAuth(authOptions);