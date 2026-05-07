import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadProfileImage } from "@/lib/profile-image-storage";

export const runtime = "nodejs";

type Ctx = { params: { workerId: string } };

export async function GET(_request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: params.workerId },
    select: { userId: true, isPublic: true, profilePhoto: true },
  });
  if (!profile?.profilePhoto) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!profile.isPublic && session.user.id !== profile.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (profile.profilePhoto.startsWith("http://") || profile.profilePhoto.startsWith("https://")) {
    return NextResponse.redirect(profile.profilePhoto);
  }

  try {
    const { data, contentType, filename } = await loadProfileImage(profile.profilePhoto);
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not read profile photo" }, { status: 500 });
  }
}
