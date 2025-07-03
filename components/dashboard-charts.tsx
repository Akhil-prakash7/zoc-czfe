"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, PieChartIcon, CalendarIcon, Filter, Download } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"

const COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444", "#10b981", "#f97316"]

export function DashboardCharts() {
  const [chartData, setChartData] = useState({
    sales: [],
    categories: [],
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("7d")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  useEffect(() => {
    fetchChartData()
  }, [timeRange, dateRange])

  const fetchChartData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      if (dateRange?.from && dateRange?.to) {
        params.append("from", dateRange.from.toISOString())
        params.append("to", dateRange.to.toISOString())
      } else {
        params.append("range", timeRange)
      }

      const response = await fetch(`/api/dashboard/charts?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setChartData(data)
      }
    } catch (error) {
      console.error("Failed to fetch chart data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickRange = (range: string) => {
    setTimeRange(range)
    setDateRange(undefined)
  }

  const exportData = async (type: "sales" | "categories") => {
    try {
      const data = type === "sales" ? chartData.sales : chartData.categories
      const csv = [Object.keys(data[0] || {}).join(","), ...data.map((row: any) => Object.values(row).join(","))].join(
        "\n",
      )

      const blob = new Blob([csv], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${type}-data.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to export data:", error)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardContent className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Quick Filters:</span>
            </div>
            <div className="flex gap-2">
              {[
                { label: "Today", value: "1d" },
                { label: "7 Days", value: "7d" },
                { label: "30 Days", value: "30d" },
                { label: "90 Days", value: "90d" },
                { label: "1 Year", value: "1y" },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={timeRange === option.value && !dateRange ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleQuickRange(option.value)}
                  className="rounded-lg"
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[280px] justify-start text-left font-normal rounded-lg",
                      !dateRange && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a custom date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sales Chart */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Daily Sales Performance</CardTitle>
                  <CardDescription>Revenue trends over selected period</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportData("sales")} className="rounded-lg">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.sales.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No sales data available
              </div>
            ) : (
              <ChartContainer
                config={{
                  sales: {
                    label: "Sales",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.sales} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorSales)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Chart */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/50">
                  <PieChartIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Category Sales</CardTitle>
                  <CardDescription>Sales breakdown by menu category</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportData("categories")} className="rounded-lg">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.categories.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No category data available
              </div>
            ) : (
              <ChartContainer
                config={{
                  value: {
                    label: "Sales %",
                  },
                }}
                className="h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.categories}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({  value }) => ` ${value}%`}
                    >
                      {chartData.categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
