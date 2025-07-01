"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Minus, ShoppingCart, Search, Filter, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface MenuItem {
  _id: string
  name: string
  price: number
  category: string
  description: string
  available: boolean
}

interface OrderItem {
  menuItem: MenuItem
  quantity: number
}

export default function NewOrderPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [customerName, setCustomerName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchMenuItems()
  }, [])

  useEffect(() => {
    filterMenuItems()
  }, [menuItems, searchTerm, categoryFilter])

  const fetchMenuItems = async () => {
    try {
      const response = await fetch("/api/menu-items")
      if (response.ok) {
        const data = await response.json()
        setMenuItems(data.filter((item: MenuItem) => item.available))
      }
    } catch (error) {
      console.error("Failed to fetch menu items:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterMenuItems = () => {
    let filtered = menuItems

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter)
    }

    setFilteredItems(filtered)
  }

  const addToOrder = (menuItem: MenuItem) => {
    const existingItem = orderItems.find((item) => item.menuItem._id === menuItem._id)
    if (existingItem) {
      setOrderItems(
        orderItems.map((item) =>
          item.menuItem._id === menuItem._id ? { ...item, quantity: item.quantity + 1 } : item,
        ),
      )
    } else {
      setOrderItems([...orderItems, { menuItem, quantity: 1 }])
    }
  }

  const updateQuantity = (menuItemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setOrderItems(orderItems.filter((item) => item.menuItem._id !== menuItemId))
    } else {
      setOrderItems(
        orderItems.map((item) => (item.menuItem._id === menuItemId ? { ...item, quantity: newQuantity } : item)),
      )
    }
  }

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + item.menuItem.price * item.quantity, 0)
  }

  const submitOrder = async () => {
    if (!customerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter customer name",
        variant: "destructive",
      })
      return
    }

    if (orderItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to the order",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: customerName.trim(),
          items: orderItems.map((item) => ({
            menuItemId: item.menuItem._id,
            name: item.menuItem.name,
            quantity: item.quantity,
            price: item.menuItem.price,
          })),
          total: calculateTotal(),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: `Order ${result.orderNumber} created successfully`,
        })
        router.push("/dashboard/orders")
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create order")
      }
    } catch (error) {
      console.error("Failed to create order:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create order",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setCategoryFilter("all")
  }

  const categories = [...new Set(menuItems.map((item) => item.category))]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-6 text-lg text-muted-foreground">Loading menu items...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full p-6">
        {/* Menu Items Section */}
        <div className="lg:col-span-2 flex flex-col space-y-6 h-full overflow-hidden">
          {/* Customer Information */}
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex-shrink-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <ShoppingCart className="h-4 w-4 text-purple-600" />
                </div>
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-sm font-medium">
                  Customer Name *
                </Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="rounded-xl border-purple-200 focus:border-purple-400 bg-white dark:bg-gray-800"
                />
              </div>
            </CardContent>
          </Card>

          {/* Search and Filter */}
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex-shrink-0">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search menu items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 rounded-xl border-purple-200 focus:border-purple-400"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[200px] rounded-xl">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(searchTerm || categoryFilter !== "all") && (
                  <Button variant="outline" onClick={clearFilters} className="rounded-xl bg-transparent">
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Menu Items Grid - Scrollable */}
          <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
            {categories
              .filter((category) => categoryFilter === "all" || categoryFilter === category)
              .map((category) => {
                const categoryItems = filteredItems.filter((item) => item.category === category)
                if (categoryItems.length === 0) return null

                return (
                  <Card key={category} className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-lg font-semibold">{category}</span>
                        <Badge variant="secondary" className="rounded-full">
                          {categoryItems.length} items
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        {categoryItems.map((item) => {
                          const orderItem = orderItems.find((oi) => oi.menuItem._id === item._id)
                          const quantity = orderItem?.quantity || 0

                          return (
                            <div
                              key={item._id}
                              className="group relative border rounded-xl p-4 hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800 hover:scale-105"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl font-bold text-emerald-600">₹{item.price.toFixed(2)}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {item.category}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              {quantity > 0 ? (
                                <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-950 rounded-lg p-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateQuantity(item._id, quantity - 1)}
                                    className="h-8 w-8 p-0 rounded-full"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="font-semibold text-lg px-4">{quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateQuantity(item._id, quantity + 1)}
                                    className="h-8 w-8 p-0 rounded-full"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  onClick={() => addToOrder(item)}
                                  className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add to Order
                                </Button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

            {filteredItems.length === 0 && (
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="p-4 rounded-full bg-muted/50 mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">No items found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar - Fixed Height */}
        <div className="flex flex-col h-full">
          <Card className="h-full border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex flex-col overflow-hidden">
            {/* Fixed Header */}
            <CardHeader className="pb-3 border-b flex-shrink-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900">
                  <ShoppingCart className="h-4 w-4 text-purple-600" />
                </div>
                Order Summary
              </CardTitle>
              <CardDescription className="font-medium text-sm">
                {orderItems.length} item{orderItems.length !== 1 ? "s" : ""} in cart
              </CardDescription>
              {orderItems.length > 0 && (
                <Badge variant="outline" className="w-fit rounded-full font-semibold text-emerald-600">
                  Total: ₹{calculateTotal().toFixed(2)}
                </Badge>
              )}
            </CardHeader>

            {/* Scrollable Content */}
            <CardContent className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {orderItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="p-3 rounded-full bg-muted/50 mb-3">
                    <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Cart is empty</p>
                  <p className="text-xs text-muted-foreground">Add items from the menu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div key={item.menuItem._id} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{item.menuItem.name}</h4>
                          <p className="text-xs text-muted-foreground">₹{item.menuItem.price.toFixed(2)} each</p>
                        </div>
                        <span className="font-bold text-emerald-600 text-sm">
                          ₹{(item.menuItem.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.menuItem._id, item.quantity - 1)}
                            className="h-6 w-6 p-0 rounded-full"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Badge variant="secondary" className="px-2 py-0.5 font-semibold text-xs">
                            {item.quantity}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.menuItem._id, item.quantity + 1)}
                            className="h-6 w-6 p-0 rounded-full"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateQuantity(item.menuItem._id, 0)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            {/* Fixed Footer */}
            {orderItems.length > 0 && (
              <div className="border-t bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-4 flex-shrink-0">
                <div className="space-y-3">
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Amount</span>
                    <span className="text-xl font-bold text-emerald-600">₹{calculateTotal().toFixed(2)}</span>
                  </div>
                  <Button
                    onClick={submitOrder}
                    disabled={submitting || !customerName.trim()}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg text-white font-semibold py-2"
                    size="sm"
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        Creating Order...
                      </div>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Create Order
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
