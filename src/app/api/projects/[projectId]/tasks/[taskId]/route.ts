import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { updateTaskSchema } from "@/lib/validations/task";
import { NotificationType } from "@prisma/client";

// GET /api/projects/[projectId]/tasks/[taskId] - Get a single task
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string; taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a member
    const isMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: params.projectId,
          userId: session.user.id,
        },
      },
    });

    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.taskId },
      include: {
        assignee: true,
        creator: true,
        labels: {
          include: {
            label: true,
          },
        },
        comments: {
          include: {
            author: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        _count: {
          select: {
            comments: true,
          },
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

// PATCH /api/projects/[projectId]/tasks/[taskId] - Update a task
export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string; taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a member
    const isMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: params.projectId,
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

    // Get existing task to compare changes
    const existingTask = await prisma.task.findUnique({
      where: { id: params.taskId },
      select: {
        status: true,
        assigneeId: true,
        title: true,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const task = await prisma.task.update({
      where: { id: params.taskId },
      data: {
        ...rest,
        ...(dueDate && { dueDate: new Date(dueDate) }),
        // Update labels if provided
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
          include: {
            label: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    // Notify new assignee if assignee changed
    if (
      rest.assigneeId &&
      rest.assigneeId !== existingTask.assigneeId &&
      rest.assigneeId !== session.user.id
    ) {
      await prisma.notification.create({
        data: {
          type: NotificationType.TASK_ASSIGNED,
          message: `You have been assigned to task "${existingTask.title}"`,
          userId: rest.assigneeId,
        },
      });
    }

    // Log status change activity
    if (rest.status && rest.status !== existingTask.status) {
      await prisma.activityLog.create({
        data: {
          action: "STATUS_CHANGED",
          message: `Task "${existingTask.title}" status changed to ${rest.status}`,
          projectId: params.projectId,
          userId: session.user.id,
          taskId: params.taskId,
        },
      });

      // Notify assignee of status change
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
      // Log general update
      await prisma.activityLog.create({
        data: {
          action: "TASK_UPDATED",
          message: `Task "${existingTask.title}" was updated`,
          projectId: params.projectId,
          userId: session.user.id,
          taskId: params.taskId,
        },
      });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASK_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId]/tasks/[taskId] - Delete a task
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string; taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is owner, maintainer or task creator
    const [member, task] = await Promise.all([
      prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: params.projectId,
            userId: session.user.id,
          },
        },
      }),
      prisma.task.findUnique({
        where: { id: params.taskId },
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
      where: { id: params.taskId },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "TASK_UPDATED",
        message: `Task "${task.title}" was deleted`,
        projectId: params.projectId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("[TASK_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}