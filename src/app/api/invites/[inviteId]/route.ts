import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { NotificationType } from "@prisma/client";

type Params = Promise<{ inviteId: string }>;

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
    const { action } = body;

    if (!["accept", "decline"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be accept or decline" },
        { status: 400 }
      );
    }

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
      await prisma.$transaction([
        prisma.projectInvite.update({
          where: { id: inviteId },
          data: { status: "ACCEPTED" },
        }),
        prisma.projectMember.create({
          data: {
            projectId: invite.projectId,
            userId: session.user.id,
            role: invite.role,
          },
        }),
        prisma.activityLog.create({
          data: {
            action: "MEMBER_ADDED",
            message: `A new member joined the project`,
            projectId: invite.projectId,
            userId: session.user.id,
          },
        }),
      ]);

      // Notify sender
      await prisma.notification.create({
        data: {
          type: NotificationType.MEMBER_ADDED,
          message: `Your invite to "${invite.project.name}" was accepted`,
          userId: invite.senderId,
        },
      });

      // Revalidate receiver's notifications
      revalidateTag(`notifications-${session.user.id}`);
      revalidateTag(`unread-notifications-${session.user.id}`);

      // Revalidate sender's notifications
      revalidateTag(`notifications-${invite.senderId}`);
      revalidateTag(`unread-notifications-${invite.senderId}`);

      revalidatePath(`/projects/${invite.projectId}`);
      revalidatePath(`/projects/${invite.projectId}/members`);
      revalidatePath("/projects");
      revalidatePath("/notifications");
      revalidatePath("/");

      return NextResponse.json({ message: "Invite accepted successfully" });
    } else {
      await prisma.projectInvite.update({
        where: { id: inviteId },
        data: { status: "DECLINED" },
      });

      // Notify sender
      await prisma.notification.create({
        data: {
          type: NotificationType.MEMBER_ADDED,
          message: `Your invite to "${invite.project.name}" was declined`,
          userId: invite.senderId,
        },
      });

      // Revalidate receiver's notifications
      revalidateTag(`notifications-${session.user.id}`);
      revalidateTag(`unread-notifications-${session.user.id}`);

      // Revalidate sender's notifications
      revalidateTag(`notifications-${invite.senderId}`);
      revalidateTag(`unread-notifications-${invite.senderId}`);

      revalidatePath("/notifications");

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