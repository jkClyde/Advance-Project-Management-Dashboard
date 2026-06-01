import { PrismaClient, MemberRole, Visibility, TaskStatus, Priority, NotificationType, ActivityAction } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaNeon({
  connectionString: process.env.DIRECT_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // =============================
  // USERS
  // =============================
  const user1 = await prisma.user.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      name: "John Doe",
      email: "john@example.com",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "jane@example.com" },
    update: {},
    create: {
      name: "Jane Smith",
      email: "jane@example.com",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=jane",
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      name: "Bob Johnson",
      email: "bob@example.com",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
    },
  });

  console.log("✅ Users created");

  // =============================
  // PROJECTS
  // =============================
  const project1 = await prisma.project.create({
    data: {
      name: "Website Redesign",
      description: "Complete overhaul of the company website with modern design",
      visibility: Visibility.TEAM,
      ownerId: user1.id,
      members: {
        create: [
          { userId: user1.id, role: MemberRole.OWNER },
          { userId: user2.id, role: MemberRole.MAINTAINER },
          { userId: user3.id, role: MemberRole.CONTRIBUTOR },
        ],
      },
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: "Mobile App",
      description: "React Native mobile application for iOS and Android",
      visibility: Visibility.PRIVATE,
      ownerId: user2.id,
      members: {
        create: [
          { userId: user2.id, role: MemberRole.OWNER },
          { userId: user1.id, role: MemberRole.CONTRIBUTOR },
        ],
      },
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: "API Development",
      description: "RESTful API development for backend services",
      visibility: Visibility.TEAM,
      ownerId: user1.id,
      members: {
        create: [
          { userId: user1.id, role: MemberRole.OWNER },
          { userId: user3.id, role: MemberRole.MAINTAINER },
        ],
      },
    },
  });

  console.log("✅ Projects created");

  // =============================
  // LABELS
  // =============================
  const labelsProject1 = await Promise.all([
    prisma.label.create({
      data: { name: "Bug", color: "#ef4444", projectId: project1.id },
    }),
    prisma.label.create({
      data: { name: "Feature", color: "#6366f1", projectId: project1.id },
    }),
    prisma.label.create({
      data: { name: "Frontend", color: "#3b82f6", projectId: project1.id },
    }),
    prisma.label.create({
      data: { name: "Backend", color: "#8b5cf6", projectId: project1.id },
    }),
    prisma.label.create({
      data: { name: "Urgent", color: "#f97316", projectId: project1.id },
    }),
  ]);

  const labelsProject2 = await Promise.all([
    prisma.label.create({
      data: { name: "Bug", color: "#ef4444", projectId: project2.id },
    }),
    prisma.label.create({
      data: { name: "Feature", color: "#6366f1", projectId: project2.id },
    }),
    prisma.label.create({
      data: { name: "UI", color: "#14b8a6", projectId: project2.id },
    }),
  ]);

  console.log("✅ Labels created");

  // =============================
  // TASKS - Project 1
  // =============================
  const task1 = await prisma.task.create({
    data: {
      title: "Design new homepage layout",
      description: "Create wireframes and mockups for the new homepage design",
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      projectId: project1.id,
      creatorId: user1.id,
      assigneeId: user2.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      labels: {
        create: [
          { labelId: labelsProject1[1].id }, // Feature
          { labelId: labelsProject1[2].id }, // Frontend
        ],
      },
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: "Fix navigation menu on mobile",
      description: "The navigation menu is broken on mobile devices below 375px",
      status: TaskStatus.OPEN,
      priority: Priority.URGENT,
      projectId: project1.id,
      creatorId: user2.id,
      assigneeId: user3.id,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      labels: {
        create: [
          { labelId: labelsProject1[0].id }, // Bug
          { labelId: labelsProject1[4].id }, // Urgent
        ],
      },
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: "Implement dark mode",
      description: "Add dark mode support across all pages",
      status: TaskStatus.OPEN,
      priority: Priority.MEDIUM,
      projectId: project1.id,
      creatorId: user1.id,
      assigneeId: user1.id,
      labels: {
        create: [
          { labelId: labelsProject1[1].id }, // Feature
          { labelId: labelsProject1[2].id }, // Frontend
        ],
      },
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: "Setup CI/CD pipeline",
      description: "Configure GitHub Actions for automated testing and deployment",
      status: TaskStatus.CLOSED,
      priority: Priority.HIGH,
      projectId: project1.id,
      creatorId: user1.id,
      assigneeId: user1.id,
      labels: {
        create: [
          { labelId: labelsProject1[3].id }, // Backend
        ],
      },
    },
  });

  const task5 = await prisma.task.create({
    data: {
      title: "Optimize image loading",
      description: "Implement lazy loading and WebP format for all images",
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.LOW,
      projectId: project1.id,
      creatorId: user2.id,
      assigneeId: user2.id,
      labels: {
        create: [
          { labelId: labelsProject1[2].id }, // Frontend
        ],
      },
    },
  });

  // =============================
  // TASKS - Project 2
  // =============================
  const task6 = await prisma.task.create({
    data: {
      title: "Setup React Native project",
      description: "Initialize React Native project with TypeScript and navigation",
      status: TaskStatus.CLOSED,
      priority: Priority.HIGH,
      projectId: project2.id,
      creatorId: user2.id,
      assigneeId: user2.id,
      labels: {
        create: [
          { labelId: labelsProject2[1].id }, // Feature
        ],
      },
    },
  });

  const task7 = await prisma.task.create({
    data: {
      title: "Design login screen",
      description: "Create login and registration screens with proper validation",
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      projectId: project2.id,
      creatorId: user2.id,
      assigneeId: user1.id,
      labels: {
        create: [
          { labelId: labelsProject2[2].id }, // UI
          { labelId: labelsProject2[1].id }, // Feature
        ],
      },
    },
  });

  const task8 = await prisma.task.create({
    data: {
      title: "Fix iOS crash on startup",
      description: "App crashes on iOS 16 devices when opening for the first time",
      status: TaskStatus.OPEN,
      priority: Priority.URGENT,
      projectId: project2.id,
      creatorId: user1.id,
      assigneeId: user2.id,
      labels: {
        create: [
          { labelId: labelsProject2[0].id }, // Bug
        ],
      },
    },
  });

  console.log("✅ Tasks created");

  // =============================
  // COMMENTS
  // =============================
  await prisma.comment.create({
    data: {
      content: "I have started working on the wireframes. Will share by EOD.",
      taskId: task1.id,
      authorId: user2.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: "Looks great! Make sure to follow the brand guidelines.",
      taskId: task1.id,
      authorId: user1.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: "This is affecting 30% of mobile users. Needs immediate attention.",
      taskId: task2.id,
      authorId: user1.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: "I can reproduce the issue. Looking into the CSS breakpoints.",
      taskId: task2.id,
      authorId: user3.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: "The crash seems to be related to the splash screen initialization.",
      taskId: task8.id,
      authorId: user2.id,
    },
  });

  console.log("✅ Comments created");

  // =============================
  // NOTIFICATIONS
  // =============================
  await prisma.notification.createMany({
    data: [
      {
        type: NotificationType.TASK_ASSIGNED,
        message: `You have been assigned to task "Design new homepage layout"`,
        userId: user2.id,
        read: false,
      },
      {
        type: NotificationType.TASK_ASSIGNED,
        message: `You have been assigned to task "Fix navigation menu on mobile"`,
        userId: user3.id,
        read: false,
      },
      {
        type: NotificationType.MEMBER_ADDED,
        message: `You have been added to project "Website Redesign"`,
        userId: user2.id,
        read: true,
      },
      {
        type: NotificationType.TASK_MENTIONED,
        message: `New comment on task "Design new homepage layout"`,
        userId: user2.id,
        read: false,
      },
      {
        type: NotificationType.STATUS_CHANGED,
        message: `Task "Setup CI/CD pipeline" status changed to CLOSED`,
        userId: user1.id,
        read: true,
      },
    ],
  });

  console.log("✅ Notifications created");

  // =============================
  // ACTIVITY LOGS
  // =============================
  await prisma.activityLog.createMany({
    data: [
      {
        action: ActivityAction.TASK_CREATED,
        message: `Task "Design new homepage layout" was created`,
        projectId: project1.id,
        userId: user1.id,
        taskId: task1.id,
      },
      {
        action: ActivityAction.TASK_CREATED,
        message: `Task "Fix navigation menu on mobile" was created`,
        projectId: project1.id,
        userId: user2.id,
        taskId: task2.id,
      },
      {
        action: ActivityAction.MEMBER_ADDED,
        message: `Jane Smith was added to the project`,
        projectId: project1.id,
        userId: user1.id,
      },
      {
        action: ActivityAction.MEMBER_ADDED,
        message: `Bob Johnson was added to the project`,
        projectId: project1.id,
        userId: user1.id,
      },
      {
        action: ActivityAction.STATUS_CHANGED,
        message: `Task "Setup CI/CD pipeline" status changed to CLOSED`,
        projectId: project1.id,
        userId: user1.id,
        taskId: task4.id,
      },
      {
        action: ActivityAction.COMMENT_ADDED,
        message: `A comment was added to task "Design new homepage layout"`,
        projectId: project1.id,
        userId: user2.id,
        taskId: task1.id,
      },
      {
        action: ActivityAction.TASK_CREATED,
        message: `Task "Setup React Native project" was created`,
        projectId: project2.id,
        userId: user2.id,
        taskId: task6.id,
      },
      {
        action: ActivityAction.TASK_CREATED,
        message: `Task "Fix iOS crash on startup" was created`,
        projectId: project2.id,
        userId: user1.id,
        taskId: task8.id,
      },
    ],
  });

  console.log("✅ Activity logs created");
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });