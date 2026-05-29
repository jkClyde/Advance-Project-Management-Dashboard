"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        await signIn("google", { callbackUrl: "/" })
    }

    return (
        <Card className="w-full max-w-md rounded-lg border bg-card text-card-foreground shadow-sm">
            <CardHeader className="text-center space-y-2">
                <CardTitle className="text-2xl font-semibold">
                    Welcome Back
                </CardTitle>
                <CardDescription>
                    Sign in with Google to continue to your dashboard.
                </CardDescription>
            </CardHeader>

            <CardContent>
                <Button
                    type="button"
                    className="w-full"
                    disabled={isLoading}
                    onClick={handleGoogleLogin}
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? "Redirecting..." : "Continue with Google"}
                </Button>
            </CardContent>
        </Card>
    )
}