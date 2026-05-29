import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLabelSchema, updateLabelSchema } from "@/lib/validations/task";

// GET /api/projects/[projectId]/labels - Get all labels
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
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

    const labels = await prisma.label.findMany({
      where: { projectId: params.projectId },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(labels);
  } catch (error) {
    console.error("[LABELS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/labels - Create a label
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
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: params.projectId,
          userId: session.user.id,
        },
      },
    });

    if (!member || !["OWNER", "MAINTAINER"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = createLabelSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors },
        { status: 400 }
      );
    }

    const { name, color } = result.data;

    // Check if label already exists in this project
    const existingLabel = await prisma.label.findUnique({
      where: {
        name_projectId: {
          name,
          projectId: params.projectId,
        },
      },
    });

    if (existingLabel) {
      return NextResponse.json(
        { error: "Label with this name already exists" },
        { status: 409 }
      );
    }

    const label = await prisma.label.create({
      data: {
        name,
        color,
        projectId: params.projectId,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "LABEL_ADDED",
        message: `Label "${name}" was created`,
        projectId: params.projectId,
        userId: session.user.id,
      },
    });

    return NextResponse.json(label, { status: 201 });
  } catch (error) {
    console.error("[LABELS_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[projectId]/labels - Update a label
export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is owner or maintainer
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: params.projectId,
          userId: session.user.id,
        },
      },
    });

    if (!member || !["OWNER", "MAINTAINER"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { labelId, ...rest } = body;
    const result = updateLabelSchema.safeParse(rest);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors },
        { status: 400 }
      );
    }

    const label = await prisma.label.update({
      where: { id: labelId },
      data: result.data,
    });

    return NextResponse.json(label);
  } catch (error) {
    console.error("[LABELS_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId]/labels - Delete a label
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is owner or maintainer
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: params.projectId,
          userId: session.user.id,
        },
      },
    });

    if (!member || !["OWNER", "MAINTAINER"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const labelId = searchParams.get("labelId");

    if (!labelId) {
      return NextResponse.json(
        { error: "labelId is required" },
        { status: 400 }
      );
    }

    await prisma.label.delete({
      where: { id: labelId },
    });

    return NextResponse.json({ message: "Label deleted successfully" });
  } catch (error) {
    console.error("[LABELS_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}