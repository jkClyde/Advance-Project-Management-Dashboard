"use client"

import { signOut, useSession } from "next-auth/react"
import { LogOut, Settings, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type UserMenuProps = {
    showName?: boolean
    triggerClassName?: string
}

export default function UserMenu({
                                     showName = false,
                                     triggerClassName = "",
                                 }: UserMenuProps) {
    const { data: session } = useSession()

    const userName = session?.user?.name || "User"
    const userEmail = session?.user?.email
    const userImage = session?.user?.image || "/logo.svg"

    const initials =
        userName
            .split(" ")
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "U"

    return (
        <AlertDialog>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className={`flex items-center gap-2 rounded-md outline-none ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${triggerClassName}`}
                    >
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={userImage} alt={userName} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>

                        {showName && <span className="truncate text-sm">{userName}</span>}
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" sideOffset={10} className="w-56">
                    <DropdownMenuLabel>
                        <div className="flex flex-col">
                            <span>{userName}</span>
                            {userEmail && (
                                <span className="text-xs font-normal text-muted-foreground">
                  {userEmail}
                </span>
                            )}
                        </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        Profile
                    </DropdownMenuItem>

                    <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                            variant="destructive"
                            onSelect={(event) => event.preventDefault()}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Log out of your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                        You will be redirected to the login page and need to sign in again.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                    >
                        Yes, logout
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}