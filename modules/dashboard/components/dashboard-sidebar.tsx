"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Code2,
  Compass,
  FolderPlus,
  History,
  Home,
  LayoutDashboard,
  Lightbulb,
  type LucideIcon,
  Plus,
  Settings,
  Star,
  Terminal,
  Zap,
  Database,
  FlameIcon,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import Image from "next/image"

// --------------------
// Types
// --------------------
interface PlaygroundData {
  id: string
  name: string
  icon: string
  starred: boolean
}

// --------------------
// Icon map
// --------------------
const lucideIconMap: Record<string, LucideIcon> = {
  Zap,
  Lightbulb,
  Database,
  Compass,
  FlameIcon,
  Terminal,
  Code2,
}

// --------------------
// Component
// --------------------
export function DashboardSidebar({
  initialPlaygroundData = [],
}: {
  initialPlaygroundData?: PlaygroundData[]
}) {
  const pathname = usePathname()

  const [starredPlaygrounds] = useState(
    initialPlaygroundData.filter((p) => p.starred)
  )

  const [recentPlaygrounds] = useState(initialPlaygroundData)

  const isEmpty =
    starredPlaygrounds.length === 0 && recentPlaygrounds.length === 0

  return (
    <Sidebar variant="inset" collapsible="icon" className="border-r">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-3 justify-center">
          <Image src="/logo.svg" alt="logo" height={60} width={60} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/"} tooltip="Home">
                <Link href="/">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/dashboard"}
                tooltip="Dashboard"
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Starred */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <Star className="h-4 w-4 mr-2" />
            Starred
          </SidebarGroupLabel>

          <SidebarGroupAction title="Add starred playground">
            <Plus className="h-4 w-4" />
          </SidebarGroupAction>

          <SidebarGroupContent>
            <SidebarMenu>
              {isEmpty ? (
                <div className="text-center text-muted-foreground py-4 w-full">
                  Create your playground
                </div>
              ) : (
                starredPlaygrounds.map((playground) => {
                  const Icon =
                    lucideIconMap[playground.icon] ?? Code2

                  return (
                    <SidebarMenuItem key={playground.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={
                          pathname === `/playground/${playground.id}`
                        }
                        tooltip={playground.name}
                      >
                        <Link href={`/playground/${playground.id}`}>
                          <Icon className="h-4 w-4" />
                          <span>{playground.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <History className="h-4 w-4 mr-2" />
            Recent
          </SidebarGroupLabel>

          <SidebarGroupAction title="Create new playground">
            <FolderPlus className="h-4 w-4" />
          </SidebarGroupAction>

          <SidebarGroupContent>
            <SidebarMenu>
              {!isEmpty &&
                recentPlaygrounds.map((playground) => {
                  const Icon =
                    lucideIconMap[playground.icon] ?? Code2

                  return (
                    <SidebarMenuItem key={playground.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={
                          pathname === `/playground/${playground.id}`
                        }
                        tooltip={playground.name}
                      >
                        <Link href={`/playground/${playground.id}`}>
                          <Icon className="h-4 w-4" />
                          <span>{playground.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="View all">
                  
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
