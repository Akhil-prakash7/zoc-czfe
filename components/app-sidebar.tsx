"use client"
import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  Menu,
  Settings,
  ShoppingCart,
  LogOut,
  Moon,
  Sun,
  User,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Orders",
    url: "/dashboard/orders",
    icon: ShoppingCart,
  },
  {
    title: "Menu Items",
    url: "/dashboard/menu-items",
    icon: Menu,
  },
  {
    title: "Billing",
    url: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Sidebar
      collapsible="icon"
      className={`border-r shadow-2xl ${
        theme === "dark"
          ? "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
          : "bg-gradient-to-br from-slate-800 via-purple-800 to-slate-800"
      }`}
    >
      <SidebarHeader className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
            <ShoppingCart className="h-5 w-5 text-white" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <span className="text-xl font-bold text-white">ZOC-CAFE</span>
            <p className="text-xs text-purple-200">Management System</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        <div className="mb-8 flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
          <Avatar className="h-10 w-10 ring-2 ring-purple-400">
            <AvatarImage src="/placeholder-user.jpg" />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-semibold text-white">Staff Member</p>
            <p className="text-xs text-purple-200">Team Member</p>
          </div>
        </div>

        <SidebarMenu className="space-y-2">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.url}
                tooltip={item.title}
                className="text-white hover:bg-white/20 hover:text-white data-[active=true]:bg-gradient-to-r data-[active=true]:from-purple-500 data-[active=true]:to-pink-500 data-[active=true]:shadow-lg data-[active=true]:text-white rounded-xl transition-all duration-200 group"
              >
                <Link
                  href={item.url}
                  className="flex items-center gap-3 px-4 py-3 text-white hover:text-white group-hover:text-white"
                >
                  <item.icon className="h-5 w-5 text-white group-hover:text-white" />
                  <span className="font-medium text-white group-hover:text-white">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/10">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full justify-start text-white hover:bg-white/20 hover:text-white rounded-xl transition-all duration-200 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 mr-3 text-white group-data-[collapsible=icon]:mr-0" />
            ) : (
              <Moon className="h-4 w-4 mr-3 text-white group-data-[collapsible=icon]:mr-0" />
            )}
            <span className="text-white group-data-[collapsible=icon]:hidden">
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-white hover:bg-white/20 hover:text-white rounded-xl group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
          >
            <Settings className="h-4 w-4 mr-3 text-white group-data-[collapsible=icon]:mr-0" />
            <span className="text-white group-data-[collapsible=icon]:hidden">Settings</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-white hover:bg-white/20 hover:text-white rounded-xl group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
          >
            <LogOut className="h-4 w-4 mr-3 text-white group-data-[collapsible=icon]:mr-0" />
            <span className="text-white group-data-[collapsible=icon]:hidden">Sign Out</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
