"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ListTodo,
  Users,
  Activity,
  Settings,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  Overview: <LayoutDashboard className="h-4 w-4" />,
  Board: <LayoutDashboard className="h-4 w-4" />,
  Tasks: <ListTodo className="h-4 w-4" />,
  Members: <Users className="h-4 w-4" />,
  Activity: <Activity className="h-4 w-4" />,
  Settings: <Settings className="h-4 w-4" />,
};

interface ActiveTabLinkProps {
  href: string;
  label: string;
  exact: boolean;
  projectId: string;
}

export default function ActiveTabLink({
  href,
  label,
  exact,
  projectId,
}: ActiveTabLinkProps) {
  const pathname = usePathname();

  const isActive = exact
    ? pathname === href
    : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
        isActive
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
      )}
    >
      {iconMap[label]}
      {label}
    </Link>
  );
}