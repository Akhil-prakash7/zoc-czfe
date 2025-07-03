"use client"

import { Button } from "@/components/ui/button"
import { Printer, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReceiptItem {
  name: string
  quantity: number
  price: number
}

interface ReceiptProps {
  orderNumber: string
  customerName: string
  items: ReceiptItem[]
  subtotal: number
  total: number
  paymentMethod?: string
  createdAt: string
}

export function ReceiptGenerator({
  orderNumber,
  customerName,
  items,
  subtotal,
  total,
  paymentMethod = "Cash",
  createdAt,
}: ReceiptProps) {
  const { toast } = useToast()

  const generateReceiptHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${orderNumber}</title>
        <style>
          body { font-family: 'Courier New', monospace; max-width: 300px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
          .order-info { margin-bottom: 15px; }
          .items { margin-bottom: 15px; }
          .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .totals { border-top: 1px solid #000; padding-top: 10px; }
          .total-line { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .final-total { border-top: 1px solid #000; padding-top: 5px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; border-top: 1px solid #000; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>ZOC-CAFE</h2>
          <p>Thank you for your order!</p>
        </div>
        
        <div class="order-info">
          <p><strong>Order #:</strong> ${orderNumber}</p>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Date:</strong> ${new Date(createdAt).toLocaleString()}</p>
          <p><strong>Payment:</strong> ${paymentMethod}</p>
        </div>
        
        <div class="items">
          <h3>Items:</h3>
          ${items
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
        
        <div class="totals">
          <div class="total-line">
            <span>Subtotal:</span>
            <span>₹${subtotal.toFixed(2)}</span>
          </div>
          <div class="total-line final-total">
            <span>Total:</span>
            <span>₹${total.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for dining with us!</p>
          <p>Visit us again soon!</p>
        </div>
      </body>
      </html>
    `
  }

  const printReceipt = () => {
    const receiptWindow = window.open("", "_blank")
    if (receiptWindow) {
      receiptWindow.document.write(generateReceiptHTML())
      receiptWindow.document.close()
      receiptWindow.print()
      receiptWindow.close()

      toast({
        title: "Success",
        description: "Receipt sent to printer",
      })
    }
  }

  const downloadReceipt = () => {
    const receiptHTML = generateReceiptHTML()
    const blob = new Blob([receiptHTML], { type: "text/html" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `receipt-${orderNumber}.html`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Success",
      description: "Receipt downloaded successfully",
    })
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={printReceipt} className="rounded-lg bg-transparent">
        <Printer className="h-4 w-4 mr-2" />
        Print
      </Button>
      <Button variant="outline" size="sm" onClick={downloadReceipt} className="rounded-lg bg-transparent">
        <Download className="h-4 w-4 mr-2" />
        Download
      </Button>
    </div>
  )
}
