"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette } from "lucide-react";

const themes = [
  { id: "default", name: "Default", color: "#18181b" },
  { id: "ocean", name: "Ocean Blue", color: "#3b6fd4" },
  { id: "forest", name: "Forest Green", color: "#2d8a57" },
  { id: "sunset", name: "Sunset Orange", color: "#e06530" },
  { id: "purple", name: "Purple Haze", color: "#8b3fd4" },
  { id: "rose", name: "Rose Pink", color: "#d43f5a" },
  { id: "midnight", name: "Midnight", color: "#4a5fd4" },
];

export default function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState("default");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("color-theme") ?? "default";
    setCurrentTheme(saved);
    applyTheme(saved);
  }, []);

  const applyTheme = (themeId: string) => {
    const root = document.documentElement;
    if (themeId === "default") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", themeId);
    }
  };

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    applyTheme(themeId);
    localStorage.setItem("color-theme", themeId);
  };

  const current = themes.find((t) => t.id === currentTheme);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon">
        <Palette className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Change color theme</span>
          <span
            className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full border border-background"
            style={{ backgroundColor: current?.color }}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Color Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => handleThemeChange(theme.id)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <span
              className="h-4 w-4 rounded-full border border-border shrink-0"
              style={{ backgroundColor: theme.color }}
            />
            <span>{theme.name}</span>
            {currentTheme === theme.id && (
              <span className="ml-auto text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}