export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80')`,
          }}
        />
        {/* Strong dark overlay */}
        <div className="absolute inset-0 bg-black/55" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-9 w-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5 text-white"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path d="M3 7h18M3 12h18M3 17h18" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-white font-bold text-xl">ProjectHub</span>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Manage projects
              <br />
              with your team
            </h1>
            <p className="text-white/80 text-lg leading-relaxed">
              Track tasks, collaborate with your team, and ship projects faster than ever before.
            </p>
          </div>

          <div className="space-y-3">
            {[
              "Kanban boards with drag & drop",
              "Real-time team collaboration",
              "Task assignments & notifications",
              "Activity logs & audit trails",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-3 w-3 text-white"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-white/90 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10 border-t border-white/20 pt-6">
          <p className="text-white/70 text-sm italic">
            "ProjectHub helped our team cut project delivery time by 40%."
          </p>
          <p className="text-white/50 text-xs mt-1">
            — Sarah K., Engineering Lead
          </p>
        </div>
      </div>

      {/* Right Panel — Auth form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-background">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 text-primary-foreground"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path d="M3 7h18M3 12h18M3 17h18" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-bold text-lg">ProjectHub</span>
        </div>

        {children}

        <p className="mt-8 text-xs text-muted-foreground text-center max-w-xs">
          By signing in, you agree to our{" "}
          <span className="underline cursor-pointer hover:text-foreground transition-colors">
            Terms of Service
          </span>{" "}
          and{" "}
          <span className="underline cursor-pointer hover:text-foreground transition-colors">
            Privacy Policy
          </span>
        </p>
      </div>
    </div>
  )
}