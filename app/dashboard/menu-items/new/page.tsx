"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function NewMenuItemPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    available: true,
  })

  const categories = ["Appetizers", "Main Course", "Desserts", "Beverages", "Salads", "Soups", "Sides", "Specials"]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.price || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/menu-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: Number.parseFloat(formData.price),
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Menu item created successfully",
        })
        router.push("/dashboard/menu-items")
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.details || "Failed to create menu item",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to create menu item:", error)
      toast({
        title: "Error",
        description: "Failed to create menu item",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild className="rounded-xl bg-transparent">
          <Link href="/dashboard/menu-items">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu Items
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New Menu Item</h1>
          <p className="text-muted-foreground">Create a new item for your restaurant menu</p>
        </div>
      </div>

      {/* Form */}
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Menu Item Details</CardTitle>
          <CardDescription>Fill in the information for your new menu item</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter item name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter item description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="rounded-xl min-h-[100px]"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="available"
                checked={formData.available}
                onCheckedChange={(checked) => handleInputChange("available", checked)}
              />
              <Label htmlFor="available">Available for ordering</Label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="rounded-xl">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Menu Item
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" asChild className="rounded-xl bg-transparent">
                <Link href="/dashboard/menu-items">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
