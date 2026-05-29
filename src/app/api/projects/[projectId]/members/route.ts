import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { inviteMemberSchema, updateMemberSchema } from "@/lib/validations/project";
import { NotificationType } from "@prisma/client";

// GET /api/projects/[projectId]/members - Get all members
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a member of the project
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

    const members = await prisma.projectMember.findMany({
      where: { projectId: params.projectId },
      include: {
        user: true,
      },
      orderBy: {
        joinedAt: "asc",
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("[MEMBERS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/members - Invite a member
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is owner or maintainer
    const currentMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: params.projectId,
          userId: session.user.id,
        },
      },
    });

    if (!currentMember || !["OWNER", "MAINTAINER"].includes(currentMember.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = inviteMemberSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors },
        { status: 400 }
      );
    }

    const { email, role } = result.data;

    // Find user by email
    const userToInvite = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToInvite) {
      return NextResponse.json(
        { error: "User not found. They must sign in first." },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: params.projectId,
          userId: userToInvite.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this project" },
        { status: 409 }
      );
    }

    // Add member
    const member = await prisma.projectMember.create({
      data: {
        projectId: params.projectId,
        userId: userToInvite.id,
        role,
      },
      include: {
        user: true,
      },
    });

    // Get project name for notification
    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
      select: { name: true },
    });

    // Create notification for invited user
    await prisma.notification.create({
      data: {
        type: NotificationType.MEMBER_ADDED,
        message: `You have been added to project "${project?.name}"`,
        userId: userToInvite.id,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "MEMBER_ADDED",
        message: `${userToInvite.name} was added to the project`,
        projectId: params.projectId,
        userId: session.user.id,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("[MEMBERS_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[projectId]/members - Update member role
export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only owner can change roles
    const currentMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: params.projectId,
          userId: session.user.id,
        },
      },
    });

    if (!currentMember || currentMember.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, ...rest } = body;
    const result = updateMemberSchema.safeParse(rest);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors },
        { status: 400 }
      );
    }

    const member = await prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId: params.projectId,
          userId,
        },
      },
      data: result.data,
      include: {
        user: true,
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error("[MEMBERS_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId]/members - Remove a member
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Only owner or maintainer can remove members
    // Users can also remove themselves
    const currentMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: params.projectId,
          userId: session.user.id,
        },
      },
    });

    const isSelf = userId === session.user.id;
    const isOwnerOrMaintainer =
      currentMember && ["OWNER", "MAINTAINER"].includes(currentMember.role);

    if (!isSelf && !isOwnerOrMaintainer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prevent removing the owner
    const memberToRemove = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: params.projectId,
          userId,
        },
      },
    });

    if (memberToRemove?.role === "OWNER") {
      return NextResponse.json(
        { error: "Cannot remove the project owner" },
        { status: 400 }
      );
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId: params.projectId,
          userId,
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "MEMBER_REMOVED",
        message: `A member was removed from the project`,
        projectId: params.projectId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("[MEMBERS_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}