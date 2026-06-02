import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { updateTaskSchema } from "@/lib/validations/task";
import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";

type Params = Promise<{ projectId: string; taskId: string }>;

export async function GET(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, taskId } = await params;

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

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: true,
        creator: true,
        labels: {
          include: { label: true },
        },
        comments: {
          include: { author: true },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASK_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, taskId } = await params;

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
    const result = updateTaskSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors },
        { status: 400 }
      );
    }

    const { labelIds, dueDate, ...rest } = result.data;

    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        status: true,
        assigneeId: true,
        title: true,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const cleanAssigneeId =
      !rest.assigneeId || rest.assigneeId === "unassigned"
        ? undefined
        : rest.assigneeId;

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...rest,
        assigneeId: cleanAssigneeId,
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(labelIds && {
          labels: {
            deleteMany: {},
            create: labelIds.map((labelId) => ({ labelId })),
          },
        }),
      },
      include: {
        assignee: true,
        creator: true,
        labels: {
          include: { label: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    if (
      cleanAssigneeId &&
      cleanAssigneeId !== existingTask.assigneeId &&
      cleanAssigneeId !== session.user.id
    ) {
      await prisma.notification.create({
        data: {
          type: NotificationType.TASK_ASSIGNED,
          message: `You have been assigned to task "${existingTask.title}"`,
          userId: cleanAssigneeId,
        },
      });
    }

    if (rest.status && rest.status !== existingTask.status) {
      await prisma.activityLog.create({
        data: {
          action: "STATUS_CHANGED",
          message: `Task "${existingTask.title}" status changed to ${rest.status}`,
          projectId,
          userId: session.user.id,
          taskId,
        },
      });

      if (
        existingTask.assigneeId &&
        existingTask.assigneeId !== session.user.id
      ) {
        await prisma.notification.create({
          data: {
            type: NotificationType.STATUS_CHANGED,
            message: `Task "${existingTask.title}" status changed to ${rest.status}`,
            userId: existingTask.assigneeId,
          },
        });
      }
    } else {
      await prisma.activityLog.create({
        data: {
          action: "TASK_UPDATED",
          message: `Task "${existingTask.title}" was updated`,
          projectId,
          userId: session.user.id,
          taskId,
        },
      });
    }

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/tasks`);
    revalidatePath(`/projects/${projectId}/tasks/${taskId}`);
    revalidatePath(`/projects/${projectId}/board`);
    revalidatePath(`/projects/${projectId}/activity`);
    revalidatePath("/");

    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASK_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, taskId } = await params;

    const [member, task] = await Promise.all([
      prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: session.user.id,
          },
        },
      }),
      prisma.task.findUnique({
        where: { id: taskId },
        select: { creatorId: true, title: true },
      }),
    ]);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const isCreator = task.creatorId === session.user.id;
    const isOwnerOrMaintainer =
      member && ["OWNER", "MAINTAINER"].includes(member.role);

    if (!isCreator && !isOwnerOrMaintainer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    await prisma.activityLog.create({
      data: {
        action: "TASK_UPDATED",
        message: `Task "${task.title}" was deleted`,
        projectId,
        userId: session.user.id,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/tasks`);
    revalidatePath(`/projects/${projectId}/board`);
    revalidatePath(`/projects/${projectId}/activity`);
    revalidatePath("/");

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("[TASK_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}