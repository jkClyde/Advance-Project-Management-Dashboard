"use client";

import { Moon, Sun, Bell } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { SidebarTrigger } from "./ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import UserMenu from "@/components/UserMenu";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const { setTheme } = useTheme();
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === "/") return "Dashboard";
    if (pathname === "/projects") return "Projects";
    if (pathname === "/notifications") return "Notifications";
    if (pathname === "/profile") return "Profile";
    if (pathname.includes("/board")) return "Board";
    if (pathname.includes("/tasks")) return "Tasks";
    if (pathname.includes("/members")) return "Members";
    if (pathname.includes("/settings")) return "Settings";
    if (pathname.includes("/activity")) return "Activity";
    if (pathname.includes("/projects/new")) return "New Project";
    return "ProjectHub";
  };

  return (
    <nav className="p-4 flex items-center justify-between sticky top-0 bg-background border-b z-10">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <span className="font-semibold text-lg">{getPageTitle()}</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications Bell */}
        <Button variant="ghost" size="icon" asChild>
          <Link href="/notifications">
            <Bell className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Notifications</span>
          </Link>
        </Button>

        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <UserMenu />
      </div>
    </nav>
  );
};

export default Navbar;