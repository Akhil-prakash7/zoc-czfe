"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search,
  Filter,
  CalendarIcon,
  Clock,
  ChefHat,
  CheckCircle,
  Star,
  Download,
  Eye,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { ReceiptGenerator } from "@/components/receipt-generator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"

interface Order {
  _id: string
  orderNumber: string
  customerName: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  total: number
  status: "pending" | "preparing" | "ready" | "completed"
  createdAt: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState<Date>()
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [pagination.page, statusFilter, dateFilter])

  useEffect(() => {
    
    if (pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }))
    } else {
      fetchOrders()
    }
  }, [searchTerm, statusFilter, dateFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
        ...(dateFilter && { dateFrom: dateFilter.toISOString() }),
      })

      const response = await fetch(`/api/orders?${params}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchOrders() 
        toast({
          title: "Success",
          description: "Order status updated successfully",
        })
      }
    } catch (error) {
      console.error("Failed to update order status:", error)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    }
  }

  const exportOrders = () => {
    const csv = [
      ["Order Number", "Customer", "Items", "Total", "Status", "Date"].join(","),
      ...orders.map((order) =>
        [
          order.orderNumber,
          order.customerName,
          order.items.map((item) => `${item.quantity}x ${item.name}`).join("; "),
          order.total.toFixed(2),
          order.status,
          new Date(order.createdAt).toLocaleDateString(),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "orders-export.csv"
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Success",
      description: "Orders exported successfully",
    })
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          color: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
          icon: Clock,
          iconColor: "text-amber-600",
        }
      case "preparing":
        return {
          color: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
          icon: ChefHat,
          iconColor: "text-blue-600",
        }
      case "ready":
        return {
          color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
          icon: CheckCircle,
          iconColor: "text-emerald-600",
        }
      case "completed":
        return {
          color: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200",
          icon: Star,
          iconColor: "text-purple-600",
        }
      default:
        return {
          color: "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200",
          icon: Clock,
          iconColor: "text-gray-600",
        }
    }
  }

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-6 text-lg text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl border-purple-200 focus:border-purple-400"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px] rounded-xl">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal rounded-xl",
                  !dateFilter && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter ? format(dateFilter, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus />
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={exportOrders} className="rounded-xl bg-transparent">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <div className="flex rounded-xl border">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="rounded-l-xl rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="rounded-r-xl rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button asChild className="rounded-xl">
          <Link href="/dashboard/orders/new">
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Link>
        </Button>
      </div>

      {/* Orders Display */}
      {viewMode === "table" ? (
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const statusConfig = getStatusConfig(order.status)
                  const StatusIcon = statusConfig.icon

                  return (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {order.items.slice(0, 2).map((item, index) => (
                            <div key={index} className="text-sm">
                              {item.quantity}x {item.name}
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <div className="text-xs text-muted-foreground">+{order.items.length - 2} more items</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">₹{order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={`${statusConfig.color} rounded-full px-3 py-1`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select value={order.status} onValueChange={(value) => updateOrderStatus(order._id, value)}>
                            <SelectTrigger className="w-[120px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="preparing">Preparing</SelectItem>
                              <SelectItem value="ready">Ready</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Order Details</DialogTitle>
                                <DialogDescription>Order #{order.orderNumber}</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold">Customer: {order.customerName}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(order.createdAt).toLocaleString()}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  {order.items.map((item, index) => (
                                    <div key={index} className="flex justify-between">
                                      <span>
                                        {item.quantity}x {item.name}
                                      </span>
                                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="border-t pt-2">
                                  <div className="flex justify-between font-semibold">
                                    <span>Total</span>
                                    <span>₹{order.total.toFixed(2)}</span>
                                  </div>
                                </div>
                                <ReceiptGenerator
                                  orderNumber={order.orderNumber}
                                  customerName={order.customerName}
                                  items={order.items}
                                  subtotal={order.total}
                                  total={order.total}
                                  createdAt={order.createdAt}
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        
        <div className="grid gap-6">
          {orders.length === 0 ? (
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 rounded-full bg-muted/50 mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-muted-foreground mb-2">No orders found</p>
                <p className="text-sm text-muted-foreground mb-6">Try adjusting your search or filters</p>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => {
              const statusConfig = getStatusConfig(order.status)
              const StatusIcon = statusConfig.icon

              return (
                <Card
                  key={order._id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50">
                          <StatusIcon className={`h-5 w-5 ${statusConfig.iconColor}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                          <CardDescription className="font-medium">{order.customerName}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={`${statusConfig.color} rounded-full px-3 py-1`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                        <Select value={order.status} onValueChange={(value) => updateOrderStatus(order._id, value)}>
                          <SelectTrigger className="w-[140px] rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="preparing">Preparing</SelectItem>
                            <SelectItem value="ready">Ready</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center text-sm bg-muted/30 rounded-lg p-3"
                          >
                            <span className="font-medium">
                              {item.quantity}x {item.name}
                            </span>
                            <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t pt-3 flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString()}
                        </div>
                        <div className="text-xl font-bold text-emerald-600">₹{order.total.toFixed(2)}</div>
                      </div>
                      <div className="flex justify-end">
                        <ReceiptGenerator
                          orderNumber={order.orderNumber}
                          customerName={order.customerName}
                          items={order.items}
                          subtotal={order.total}
                          total={order.total}
                          createdAt={order.createdAt}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0 rounded-lg"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="rounded-lg"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
