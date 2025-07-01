"use client"

import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Plus,
  Sparkles,
  Bell,
  User,
  ArrowLeft,
  ShoppingCart,
  Search,
  BarChart3,
  Receipt,
  Menu,
} from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function DashboardHeader() {
  const pathname = usePathname()

  const getPageConfig = () => {
    if (pathname === "/dashboard") {
      return {
        icon: Sparkles,
        title: "Welcome back",
        subtitle: "Manage your restaurant efficiently",
        actions: (
          <>
            <Button
              variant="outline"
              asChild
              className="rounded-xl border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950 bg-transparent hidden sm:flex"
            >
              <Link href="/dashboard/analytics">
                View Analytics
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
            >
              <Link href="/dashboard/orders/new">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">New Order</span>
                <span className="sm:hidden">New</span>
              </Link>
            </Button>
          </>
        ),
      }
    }

    if (pathname.startsWith("/dashboard/orders/new")) {
      return {
        icon: ShoppingCart,
        title: "Create New Order",
        subtitle: "Add items and customer details",
        backLink: "/dashboard/orders",
        actions: null,
      }
    }

    if (pathname.startsWith("/dashboard/orders")) {
      return {
        icon: Search,
        title: "Order Management",
        subtitle: "Track and manage all orders",
        actions: (
          <Button
            asChild
            className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
          >
            <Link href="/dashboard/orders/new">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">New Order</span>
              <span className="sm:hidden">New</span>
            </Link>
          </Button>
        ),
      }
    }

    if (pathname.startsWith("/dashboard/menu-items")) {
      return {
        icon: Menu,
        title: "Menu Items",
        subtitle: "Manage your restaurant menu",
        actions: (
          <Button
            asChild
            className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
          >
            <Link href="/dashboard/menu-items/new">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Add Item</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </Button>
        ),
      }
    }

    if (pathname.startsWith("/dashboard/billing")) {
      return {
        icon: Receipt,
        title: "Billing",
        subtitle: "Manage payments and receipts",
        actions: null,
      }
    }

    if (pathname.startsWith("/dashboard/analytics")) {
      return {
        icon: BarChart3,
        title: "Analytics Dashboard",
        subtitle: "Comprehensive business insights",
        actions: null,
      }
    }

    return {
      icon: Sparkles,
      title: "Dashboard",
      subtitle: "Restaurant management system",
      actions: null,
    }
  }

  const config = getPageConfig()
  const IconComponent = config.icon

  return (
    <div className="flex h-16 items-center justify-between px-4 sm:px-6">
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Mobile Sidebar Trigger */}
        <SidebarTrigger className="md:hidden -ml-1" />

        {config.backLink && (
          <Button variant="ghost" size="sm" asChild className="rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900">
            <Link href={config.backLink}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Link>
          </Button>
        )}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900">
            <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
          </div>
          <div className="hidden sm:block">
            <h2 className="text-lg font-semibold text-foreground">{config.title}</h2>
            <p className="text-xs text-muted-foreground">{config.subtitle}</p>
          </div>
          <div className="sm:hidden">
            <h2 className="text-base font-semibold text-foreground">{config.title}</h2>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-3">
        {config.actions}
        <Button variant="outline" size="icon" className="rounded-xl bg-transparent h-8 w-8 sm:h-9 sm:w-9">
          <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full">
              <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                <AvatarImage src="/placeholder-user.jpg" alt="User" />
                <AvatarFallback>
                  <User className="h-3 w-3 sm:h-4 sm:w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Staff Member</p>
                <p className="text-xs leading-none text-muted-foreground">staff@restaurant.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
