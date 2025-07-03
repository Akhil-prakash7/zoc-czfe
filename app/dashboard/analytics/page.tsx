"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Clock,
  Filter,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import { cn } from "@/lib/utils"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

interface AnalyticsData {
  dailyRevenue: Array<{ date: string; revenue: number; orders: number }>
  topMenuItems: Array<{ name: string; orders: number; revenue: number }>
  paymentMethods: Array<{ method: string; count: number; percentage: number }>
  hourlyOrders: Array<{ hour: string; orders: number }>
  summary: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    revenueGrowth: number
    ordersGrowth: number
  }
  filterOptions: {
    categories: string[]
    paymentMethods: string[]
    statuses: string[]
  }
}

const COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444", "#10b981", "#f97316"]

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 30))
  const [dateTo, setDateTo] = useState<Date>(new Date())

  
  const [paymentMethod, setPaymentMethod] = useState<string>("all")
  const [orderStatus, setOrderStatus] = useState<string>("all")
  const [category, setCategory] = useState<string>("all")
  const [minAmount, setMinAmount] = useState<string>("")
  const [maxAmount, setMaxAmount] = useState<string>("")

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()

      
      params.append("dateFrom", startOfDay(dateFrom).toISOString())
      params.append("dateTo", endOfDay(dateTo).toISOString())

 
      if (paymentMethod && paymentMethod !== "all") {
        params.append("paymentMethod", paymentMethod)
      }
      if (orderStatus && orderStatus !== "all") {
        params.append("orderStatus", orderStatus)
      }
      if (category && category !== "all") {
        params.append("category", category)
      }
      if (minAmount && minAmount.trim() !== "" && !isNaN(Number.parseFloat(minAmount))) {
        params.append("minAmount", minAmount.trim())
      }
      if (maxAmount && maxAmount.trim() !== "" && !isNaN(Number.parseFloat(maxAmount))) {
        params.append("maxAmount", maxAmount.trim())
      }

      console.log("Frontend - Fetching analytics with params:", params.toString())

      const response = await fetch(`/api/analytics?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Frontend - Analytics data received:", {
        dailyRevenueCount: data.dailyRevenue?.length || 0,
        topMenuItemsCount: data.topMenuItems?.length || 0,
        paymentMethodsCount: data.paymentMethods?.length || 0,
        hourlyOrdersCount: data.hourlyOrders?.length || 0,
        summary: data.summary,
      })

      setAnalyticsData(data)
    } catch (error) {
      console.error("Frontend - Failed to fetch analytics data:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch analytics data")
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, paymentMethod, orderStatus, category, minAmount, maxAmount])

  useEffect(() => {
    fetchAnalyticsData()
  }, [fetchAnalyticsData])

  const resetFilters = () => {
    setPaymentMethod("all")
    setOrderStatus("all")
    setCategory("all")
    setMinAmount("")
    setMaxAmount("")
    setDateFrom(subDays(new Date(), 30))
    setDateTo(new Date())
  }

  const setQuickDateRange = (days: number) => {
    setDateTo(new Date())
    setDateFrom(subDays(new Date(), days))
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading analytics data...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <Button onClick={fetchAnalyticsData} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">No analytics data available</p>
          <Button onClick={fetchAnalyticsData} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-purple-600" />
              <CardTitle>Analytics Filters</CardTitle>
            </div>
            <Button variant="outline" onClick={resetFilters} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
       
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Quick Date Range</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setQuickDateRange(7)}>
                  7D
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickDateRange(30)}>
                  30D
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickDateRange(90)}>
                  90D
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : "From date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={(date) => date && setDateFrom(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !dateTo && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : "To date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateTo} onSelect={(date) => date && setDateTo(date)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

         
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {analyticsData.filterOptions.paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Order Status</Label>
              <Select value={orderStatus} onValueChange={setOrderStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {analyticsData.filterOptions.statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {analyticsData.filterOptions.categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Min Amount ($)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label>Max Amount ($)</Label>
              <Input
                type="number"
                placeholder="1000.00"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData.summary.totalRevenue.toFixed(2)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analyticsData.summary.revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={analyticsData.summary.revenueGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(analyticsData.summary.revenueGrowth).toFixed(1)}%
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.summary.totalOrders}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analyticsData.summary.ordersGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={analyticsData.summary.ordersGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(analyticsData.summary.ordersGrowth).toFixed(1)}%
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData.summary.averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per customer transaction</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.hourlyOrders.length > 0
                ? analyticsData.hourlyOrders.reduce(
                    (max, hour) => (hour.orders > max.orders ? hour : max),
                    analyticsData.hourlyOrders[0],
                  )?.hour || "N/A"
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">Busiest hour of the day</p>
          </CardContent>
        </Card>
      </div>

      
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="menu">Menu Performance</TabsTrigger>
          <TabsTrigger value="payments">Payment Methods</TabsTrigger>
          <TabsTrigger value="hourly">Hourly Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Daily Revenue & Orders</CardTitle>
              <CardDescription>Revenue and order trends over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.dailyRevenue.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.dailyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => format(new Date(value), "MMM dd")}
                        className="text-xs"
                      />
                      <YAxis yAxisId="left" className="text-xs" />
                      <YAxis yAxisId="right" orientation="right" className="text-xs" />
                      <Tooltip
                        labelFormatter={(value) => format(new Date(value), "PPP")}
                        formatter={(value: any, name: string) => [
                          name === "revenue" ? `$${Number(value).toFixed(2)}` : value,
                          name === "revenue" ? "Revenue" : "Orders",
                        ]}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        name="Revenue ($)"
                        dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: "#8b5cf6", strokeWidth: 2 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="orders"
                        stroke="#06b6d4"
                        strokeWidth={3}
                        name="Orders"
                        dot={{ fill: "#06b6d4", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: "#06b6d4", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-gray-500">
                  No revenue data available for the selected filters
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu" className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Top Menu Items</CardTitle>
              <CardDescription>Best performing menu items by orders and revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.topMenuItems.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.topMenuItems} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} className="text-xs" />
                      <YAxis yAxisId="left" className="text-xs" />
                      <YAxis yAxisId="right" orientation="right" className="text-xs" />
                      <Tooltip
                        formatter={(value: any, name: string) => [
                          name === "revenue" ? `$${Number(value).toFixed(2)}` : value,
                          name === "revenue" ? "Revenue" : "Orders",
                        ]}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="revenue" fill="#8b5cf6" name="Revenue ($)" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="orders" fill="#06b6d4" name="Orders" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-gray-500">
                  No menu items data available for the selected filters
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Payment Methods Distribution</CardTitle>
              <CardDescription>Breakdown of payment methods used by customers</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.paymentMethods.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.paymentMethods}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analyticsData.paymentMethods.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [value, "Orders"]}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-gray-500">
                  No payment methods data available for the selected filters
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hourly" className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Hourly Order Distribution</CardTitle>
              <CardDescription>Order volume throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.hourlyOrders.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.hourlyOrders}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="hour" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        formatter={(value: any) => [value, "Orders"]}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Bar dataKey="orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-gray-500">
                  No hourly orders data available for the selected filters
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
