import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createCommentSchema, updateCommentSchema } from "@/lib/validations/task";
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

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: { author: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("[COMMENTS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const result = createCommentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors },
        { status: 400 }
      );
    }

    const { content } = result.data;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        title: true,
        assigneeId: true,
        creatorId: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        authorId: session.user.id,
      },
      include: { author: true },
    });

    const mentionRegex = /@(\w+)/g;
    const mentions = content.match(mentionRegex);

    if (mentions) {
      const projectMembers = await prisma.projectMember.findMany({
        where: { projectId },
        include: { user: true },
      });

      for (const mention of mentions) {
        const username = mention.slice(1);
        const mentionedMember = projectMembers.find(
          (m) => m.user.name?.toLowerCase() === username.toLowerCase()
        );

        if (mentionedMember && mentionedMember.userId !== session.user.id) {
          await prisma.notification.create({
            data: {
              type: NotificationType.TASK_MENTIONED,
              message: `You were mentioned in a comment on task "${task.title}"`,
              userId: mentionedMember.userId,
            },
          });
        }
      }
    }

    if (task.assigneeId && task.assigneeId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: NotificationType.TASK_MENTIONED,
          message: `New comment on task "${task.title}" assigned to you`,
          userId: task.assigneeId,
        },
      });
    }

    if (
      task.creatorId !== session.user.id &&
      task.creatorId !== task.assigneeId
    ) {
      await prisma.notification.create({
        data: {
          type: NotificationType.TASK_MENTIONED,
          message: `New comment on task "${task.title}" you created`,
          userId: task.creatorId,
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        action: "COMMENT_ADDED",
        message: `A comment was added to task "${task.title}"`,
        projectId,
        userId: session.user.id,
        taskId,
      },
    });

    revalidatePath(`/projects/${projectId}/tasks/${taskId}`);
    revalidatePath(`/projects/${projectId}/activity`);

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("[COMMENTS_POST]", error);
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

    const body = await req.json();
    const { commentId, ...rest } = body;
    const result = updateCommentSchema.safeParse(rest);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors },
        { status: 400 }
      );
    }

    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });

    if (!existingComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (existingComment.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: result.data,
      include: { author: true },
    });

    revalidatePath(`/projects/${projectId}/tasks/${taskId}`);

    return NextResponse.json(comment);
  } catch (error) {
    console.error("[COMMENTS_PATCH]", error);
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

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json(
        { error: "commentId is required" },
        { status: 400 }
      );
    }

    const [comment, member] = await Promise.all([
      prisma.comment.findUnique({
        where: { id: commentId },
        select: { authorId: true },
      }),
      prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: session.user.id,
          },
        },
      }),
    ]);

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const isAuthor = comment.authorId === session.user.id;
    const isOwnerOrMaintainer =
      member && ["OWNER", "MAINTAINER"].includes(member.role);

    if (!isAuthor && !isOwnerOrMaintainer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    revalidatePath(`/projects/${projectId}/tasks/${taskId}`);

    return NextResponse.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("[COMMENTS_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}