"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, Filter, CalendarIcon, Receipt, ChevronLeft, ChevronRight, Download, Printer } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useReactToPrint } from "react-to-print"

interface Bill {
  _id: string
  orderNumber: string
  customerName: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  status: "paid" | "pending" | "refunded"
  createdAt: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export default function BillingPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 8,
    total: 0,
    pages: 0,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState<Date>()
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchBills()
  }, [pagination.page, statusFilter, paymentMethodFilter, dateFilter])

  useEffect(() => {
   
    if (pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }))
    } else {
      fetchBills()
    }
  }, [searchTerm])

  const fetchBills = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(paymentMethodFilter !== "all" && { paymentMethod: paymentMethodFilter }),
        ...(searchTerm && { search: searchTerm }),
        ...(dateFilter && { dateFrom: dateFilter.toISOString() }),
      })

      const response = await fetch(`/api/billing?${params}`)
      if (response.ok) {
        const data = await response.json()
        setBills(data.bills || [])
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Failed to fetch bills:", error)
      toast({
        title: "Error",
        description: "Failed to fetch billing data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200"
      case "refunded":
        return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200"
    }
  }

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Billing Report - ${format(new Date(), "yyyy-MM-dd")}`,
    onAfterPrint: () => {
      toast({
        title: "Success",
        description: "Page printed successfully",
      })
    },
  })

  const handleExport = () => {
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Billing Report - ${format(new Date(), "yyyy-MM-dd")}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { display: flex; justify-content: space-around; margin-bottom: 30px; }
          .summary-card { text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .bill-item { border: 1px solid #ddd; margin-bottom: 15px; padding: 15px; border-radius: 8px; }
          .bill-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
          .items { margin: 10px 0; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { font-weight: bold; border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px; }
          .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
          .status-paid { background-color: #dcfce7; color: #166534; }
          .status-pending { background-color: #fef3c7; color: #92400e; }
          .status-refunded { background-color: #fee2e2; color: #991b1b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Restaurant POS - Billing Report</h1>
          <p>Generated on ${format(new Date(), "PPP")}</p>
        </div>
        
        <div class="summary">
          <div class="summary-card">
            <h3>Total Revenue</h3>
            <p>₹${bills
              .filter((b) => b.status === "paid")
              .reduce((sum, b) => sum + b.total, 0)
              .toFixed(2)}</p>
          </div>
          <div class="summary-card">
            <h3>Total Transactions</h3>
            <p>${bills.length}</p>
          </div>
          <div class="summary-card">
            <h3>Pending Payments</h3>
            <p>${bills.filter((b) => b.status === "pending").length}</p>
          </div>
        </div>
        
        ${bills
          .map(
            (bill) => `
          <div class="bill-item">
            <div class="bill-header">
              <div>
                <h3>Order #${bill.orderNumber}</h3>
                <p>${bill.customerName}</p>
              </div>
              <div>
                <span class="status status-${bill.status}">${bill.status.toUpperCase()}</span>
                <p>${format(new Date(bill.createdAt), "PPP")}</p>
              </div>
            </div>
            
            <div class="items">
              ${bill.items
                .map(
                  (item) => `
                <div class="item">
                  <span>${item.quantity}x ${item.name}</span>
                  <span>₹${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              `,
                )
                .join("")}
            </div>
            
            <div class="total">
              <div class="item">
                <span>Subtotal:</span>
                <span>₹${bill.subtotal.toFixed(2)}</span>
              </div>
              <div class="item">
                <span>Tax:</span>
                <span>₹${bill.tax.toFixed(2)}</span>
              </div>
              <div class="item">
                <strong>Total: ₹${bill.total.toFixed(2)}</strong>
              </div>
              <p>Payment: ${bill.paymentMethod}</p>
            </div>
          </div>
        `,
          )
          .join("")}
      </body>
      </html>
    `

    const blob = new Blob([htmlContent], { type: "text/html" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `billing-report-${format(new Date(), "yyyy-MM-dd")}.html`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Success",
      description: "Billing report exported successfully",
    })
  }

  const totalRevenue = bills.filter((bill) => bill.status === "paid").reduce((sum, bill) => sum + bill.total, 0)
  const pendingAmount = bills.filter((bill) => bill.status === "pending").reduce((sum, bill) => sum + bill.total, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-6 text-lg text-muted-foreground">Loading billing data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
     
      <div className="flex justify-end gap-2 mb-4">
        <Button variant="outline" onClick={handleExport} className="rounded-xl bg-transparent">
          <Download className="mr-2 h-4 w-4" />
          Export Page
        </Button>
        <Button variant="outline" onClick={handlePrint} className="rounded-xl bg-transparent">
          <Printer className="mr-2 h-4 w-4" />
          Print Page
        </Button>
      </div>

      
      <div ref={printRef}>
       
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <Receipt className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">From paid orders</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Receipt className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">₹{pendingAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Awaiting payment</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <Receipt className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{bills.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search bills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl border-purple-200 focus:border-purple-400"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] rounded-xl">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="w-[180px] rounded-xl">
                  <SelectValue placeholder="Payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal rounded-xl",
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
            </div>
          </CardContent>
        </Card>

        {/* Bills List */}
        <div className="grid gap-4">
          {bills.length === 0 ? (
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">No bills found</p>
              </CardContent>
            </Card>
          ) : (
            bills.map((bill) => (
              <Card
                key={bill._id}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{bill.orderNumber}</CardTitle>
                      <CardDescription>{bill.customerName}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getStatusColor(bill.status)} rounded-full px-3 py-1`}>
                        {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      {bill.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-2 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>₹{bill.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax</span>
                        <span>₹{bill.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>₹{bill.total.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>Payment: {bill.paymentMethod}</span>
                      <span>{new Date(bill.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/*Pagination */}
      {pagination.pages > 1 && (
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} bills
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
