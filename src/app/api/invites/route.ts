import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NotificationType } from "@prisma/client";

type Params = Promise<{ inviteId: string }>;

// PATCH /api/invites/[inviteId] - Accept or decline invite
export async function PATCH(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { inviteId } = await params;
    const body = await req.json();
    const { action } = body; // "accept" or "decline"

    if (!["accept", "decline"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be accept or decline" },
        { status: 400 }
      );
    }

    // Get invite
    const invite = await prisma.projectInvite.findUnique({
      where: { id: inviteId },
      include: {
        project: { select: { id: true, name: true } },
        sender: { select: { id: true, name: true } },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Only the receiver can respond
    if (invite.receiverId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (invite.status !== "PENDING") {
      return NextResponse.json(
        { error: "Invite has already been responded to" },
        { status: 400 }
      );
    }

    if (action === "accept") {
      // Add user to project
      await prisma.$transaction([
        // Update invite status
        prisma.projectInvite.update({
          where: { id: inviteId },
          data: { status: "ACCEPTED" },
        }),
        // Add member to project
        prisma.projectMember.create({
          data: {
            projectId: invite.projectId,
            userId: session.user.id,
            role: invite.role,
          },
        }),
        // Log activity
        prisma.activityLog.create({
          data: {
            action: "MEMBER_ADDED",
            message: `A new member joined the project`,
            projectId: invite.projectId,
            userId: session.user.id,
          },
        }),
      ]);

      // Notify sender that invite was accepted
      await prisma.notification.create({
        data: {
          type: NotificationType.MEMBER_ADDED,
          message: `Your invite to "${invite.project.name}" was accepted`,
          userId: invite.senderId,
        },
      });

      revalidatePath(`/projects/${invite.projectId}`);
      revalidatePath(`/projects/${invite.projectId}/members`);
      revalidatePath("/projects");
      revalidatePath("/");

      return NextResponse.json({ message: "Invite accepted successfully" });
    } else {
      // Decline invite
      await prisma.projectInvite.update({
        where: { id: inviteId },
        data: { status: "DECLINED" },
      });

      // Notify sender that invite was declined
      await prisma.notification.create({
        data: {
          type: NotificationType.MEMBER_ADDED,
          message: `Your invite to "${invite.project.name}" was declined`,
          userId: invite.senderId,
        },
      });

      return NextResponse.json({ message: "Invite declined" });
    }
  } catch (error) {
    console.error("[INVITE_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}