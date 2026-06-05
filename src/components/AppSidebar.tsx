"use client";

import {
  Home,
  FolderKanban,
  Bell,
  Plus,
  User,
  LayoutDashboard,
  Lock,
  Globe,
  ChevronRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "./ui/sidebar";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUnreadNotifications } from "@/hooks/use-notifications";

interface RecentProject {
  id: string;
  name: string;
  visibility: string;
}

interface AppSidebarProps {
  recentProjects: RecentProject[];
}

const AppSidebar = ({ recentProjects }: AppSidebarProps) => {
  const pathname = usePathname();
  const { unreadCount } = useUnreadNotifications();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  const mainItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: FolderKanban,
    },
    {
      title: "Notifications",
      url: "/notifications",
      icon: Bell,
      badge: unreadCount,
    },
    {
      title: "Profile",
      url: "/profile",
      icon: User,
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link
                href="/"
                className="flex items-center gap-2"
                onClick={handleNavClick}
              >
                <Home className="h-5 w-5" />
                <span className="font-semibold">ProjectHub</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      pathname === item.url &&
                        "bg-accent text-accent-foreground"
                    )}
                  >
                    <Link href={item.url} onClick={handleNavClick}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge && item.badge > 0 && (
                    <SidebarMenuBadge>
                      {item.badge > 99 ? "99+" : item.badge}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Projects */}
        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupAction asChild>
            <Link href="/projects/new" onClick={handleNavClick}>
              <Plus className="h-4 w-4" />
              <span className="sr-only">New Project</span>
            </Link>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Recent projects */}
              {recentProjects.map((project) => (
                <SidebarMenuItem key={project.id}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      pathname.startsWith(`/projects/${project.id}`) &&
                        "bg-accent text-accent-foreground"
                    )}
                  >
                    <Link
                      href={`/projects/${project.id}`}
                      onClick={handleNavClick}
                      className="flex items-center gap-2"
                    >
                      {project.visibility === "PRIVATE" ? (
                        <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate">{project.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* View all projects */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className={cn(
                    pathname === "/projects" &&
                      "bg-accent text-accent-foreground"
                  )}
                >
                  <Link
                    href="/projects"
                    onClick={handleNavClick}
                    className="text-muted-foreground"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span>All Projects</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* New project */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/projects/new" onClick={handleNavClick}>
                    <Plus className="h-4 w-4" />
                    <span>New Project</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu
              showName
              triggerClassName="w-full px-2 py-2 justify-start"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;