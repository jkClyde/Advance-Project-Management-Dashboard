import AppSidebar from "@/components/AppSidebar"
import Navbar from "@/components/Navbar"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { cookies } from "next/headers"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import AuthProvider from "@/components/AuthProvider"
import { Toaster } from "sonner"
import { getRecentProjectsByUserId } from "@/lib/data/projects"


export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect("/login")
  }

  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  // ✅ Fetch real projects for sidebar
  const recentProjects = await getRecentProjectsByUserId(session.user.id)

  return (
    <AuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('color-theme');
                if (theme && theme !== 'default') {
                  document.documentElement.setAttribute('data-theme', theme);
                }
              } catch(e) {}
            `,
          }}
        />
        <SidebarProvider defaultOpen={defaultOpen}>
          <div className="flex w-full min-h-screen bg-background text-foreground">
            <AppSidebar recentProjects={recentProjects} />
            <main className="w-full">
              <Navbar />
              <div className="px-4">{children}</div>
            </main>
          </div>
          <Toaster richColors position="top-right" />
        </SidebarProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}