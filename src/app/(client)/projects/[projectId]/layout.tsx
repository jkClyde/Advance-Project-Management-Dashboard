import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getProjectById, getProjectMember } from "@/lib/data/projects";
import ActiveTabLink from "@/components/features/projects/ActiveTabLink";
import {
  FolderKanban,
  Lock,
  Globe,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>;
}): Promise<Metadata> {
  const session = await getServerSession(authOptions);
  const { projectId } = await params;
  const project = await getProjectById(projectId, session?.user?.id ?? "");

  return {
    title: project?.name ?? "Project",
  };
}


const navTabs = (projectId: string) => [
  {
    label: "Overview",
    href: `/projects/${projectId}`,
    exact: true,
  },
  {
    label: "Board",
    href: `/projects/${projectId}/board`,
    exact: false,
  },
  {
    label: "Tasks",
    href: `/projects/${projectId}/tasks`,
    exact: false,
  },
  {
    label: "Members",
    href: `/projects/${projectId}/members`,
    exact: false,
  },
  {
    label: "Activity",
    href: `/projects/${projectId}/activity`,
    exact: false,
  },
  {
    label: "Settings",
    href: `/projects/${projectId}/settings`,
    exact: false,
  },
];

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const { projectId } = await params;

  const [project, member] = await Promise.all([
    getProjectById(projectId, userId),
    getProjectMember(projectId, userId),
  ]);

  if (!project) notFound();
  if (!member) redirect("/projects");

  const tabs = navTabs(projectId);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Project Header */}
      <div className="border-b bg-background px-6 pt-6 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{project.name}</h1>
            <Badge
              variant="outline"
              className="flex items-center gap-1 text-xs"
            >
              {project.visibility === "PRIVATE" ? (
                <>
                  <Lock className="h-3 w-3" />
                  Private
                </>
              ) : (
                <>
                  <Globe className="h-3 w-3" />
                  Team
                </>
              )}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {member.role}
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <ActiveTabLink
              key={tab.label}
              href={tab.href}
              label={tab.label}
              exact={tab.exact}
              projectId={projectId}
            />
          ))}
        </nav>
      </div>

      {/* Page Content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}