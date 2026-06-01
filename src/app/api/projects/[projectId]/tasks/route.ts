import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createTaskSchema } from "@/lib/validations/task";
import { NotificationType } from "@prisma/client";

/**
 * GET /api/projects/[projectId]/tasks
 */
export async function GET(
  req: NextRequest,
  context: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = context.params.projectId;

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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");
    const labelId = searchParams.get("labelId");
    const search = searchParams.get("search");

    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        ...(status && { status: status as any }),
        ...(priority && { priority: priority as any }),
        ...(assigneeId && { assigneeId }),
        ...(labelId && {
          labels: { some: { labelId } },
        }),
        ...(search && {
          title: {
            contains: search,
            mode: "insensitive",
          },
        }),
      },
      include: {
        assignee: true,
        creator: true,
        labels: { include: { label: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("[TASKS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[projectId]/tasks
 */
export async function POST(
  req: NextRequest,
  context: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = context.params.projectId;

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
      return NextResponse.json(
        { error: result.error.errors },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      status,
      priority,
      assigneeId,
      dueDate,
      labelIds,
    } = result.data;

    const cleanAssigneeId =
      !assigneeId || assigneeId === "unassigned"
        ? undefined
        : assigneeId;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        assigneeId: cleanAssigneeId,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        creatorId: session.user.id,
        ...(labelIds?.length
          ? {
              labels: {
                create: labelIds.map((labelId) => ({
                  labelId,
                })),
              },
            }
          : {}),
      },
      include: {
        assignee: true,
        creator: true,
        labels: { include: { label: true } },
      },
    });

    if (assigneeId && assigneeId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: NotificationType.TASK_ASSIGNED,
          message: `You have been assigned to task "${title}"`,
          userId: assigneeId,
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        action: "TASK_CREATED",
        message: `Task "${title}" was created`,
        projectId,
        userId: session.user.id,
        taskId: task.id,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("[TASKS_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}