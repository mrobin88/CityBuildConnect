import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const allowedRoles = new Set<UserRole>(["WORKER", "EMPLOYER"]);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      role?: UserRole;
    };

    const email = body.email?.toLowerCase().trim() ?? "";
    const password = body.password ?? "";
    const firstName = body.firstName?.trim() ?? "";
    const lastName = body.lastName?.trim() ?? "";
    const role = body.role && allowedRoles.has(body.role) ? body.role : "WORKER";

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const fullName = `${firstName} ${lastName}`.trim();
    const passwordHash = hashPassword(password);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const existingCreds = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: "credentials",
            providerAccountId: email,
          },
        },
      });

      if (existingCreds) {
        return NextResponse.json({ error: "An account already exists for this email." }, { status: 409 });
      }

      await prisma.account.create({
        data: {
          userId: existing.id,
          type: "credentials",
          provider: "credentials",
          providerAccountId: email,
          access_token: passwordHash,
        },
      });

      if (!existing.name || !existing.name.trim()) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { name: fullName, role },
        });
      }

      return NextResponse.json({ ok: true });
    }

    await prisma.user.create({
      data: {
        email,
        name: fullName,
        role,
        accounts: {
          create: {
            type: "credentials",
            provider: "credentials",
            providerAccountId: email,
            access_token: passwordHash,
          },
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to create account right now." }, { status: 500 });
  }
}
