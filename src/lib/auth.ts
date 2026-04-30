import type { NextAuthOptions } from "next-auth";
import type { UserRole } from "@prisma/client";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

const providers: NextAuthOptions["providers"] = [];

providers.push(
  CredentialsProvider({
    id: "password",
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email?.toLowerCase().trim();
      const password = credentials?.password;
      if (!email || !password) return null;

      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: "credentials",
            providerAccountId: email,
          },
        },
        include: { user: true },
      });

      if (!account?.access_token) return null;
      if (!verifyPassword(password, account.access_token)) return null;

      return {
        id: account.user.id,
        email: account.user.email,
        name: account.user.name,
        image: account.user.image,
        role: account.user.role,
      };
    },
  })
);

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
  providers.push(
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    })
  );
}

function devCredentialsProvider() {
  return CredentialsProvider({
    id: "dev-credentials",
    name: "Dev login",
    credentials: {
      email: { label: "Email", type: "email", placeholder: "worker@hingeline.local" },
    },
    async authorize(credentials) {
      const email = credentials?.email?.toLowerCase().trim();
      if (!email) return null;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      };
    },
  });
}

if (process.env.DEV_AUTH_BYPASS === "true") {
  providers.push(devCredentialsProvider());
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        const db = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        token.role = db?.role ?? (user as { role?: UserRole }).role;
      }
      if (trigger === "update" && token.id) {
        const db = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, name: true, email: true, image: true },
        });
        if (db) token.role = db.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as NonNullable<typeof token.role>;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
