import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createTaskSchema } from "@/lib/validations/task";
import { NotificationType } from "@prisma/client";

export async function GET(
  req: NextRequest,
  context: { params: { projectId: string } }
) {
  const projectId = context.params.projectId;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: session.user.id,
      },
    },
  });

  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tasks = await prisma.task.findMany({
    where: { projectId },
  });

  return NextResponse.json(tasks);
}

export async function POST(
  req: NextRequest,
  context: { params: { projectId: string } }
) {
  const projectId = context.params.projectId;

  console.log("DEBUG projectId:", projectId, typeof projectId);

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: session.user.id,
      },
    },
  });

  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const result = createTaskSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.errors }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      ...result.data,
      projectId,
      creatorId: session.user.id,
    },
  });

  return NextResponse.json(task, { status: 201 });
}