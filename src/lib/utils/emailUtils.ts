// src/lib/utils/emailUtils.ts
import { Resend } from 'resend'

const resend = new Resend('re_PEfToTwp_GS5nMLok6QSgC4w8CFEjo5UD')

const ADMIN_EMAILS = [
    "jaadbarg@gmail.com"
    /*, "amin@americanwholesalers.us",
       "sean@americanwholesalers.us",
       "juddy@americanwholesalers.us",
       "shatha@americanwholesalers.us",
       "donna@americanwholesalers.us",
       "sales@americanwholesalers.us" */
  ];
  
// Initial order confirmation to customer
export async function sendOrderConfirmationEmail(orderDetails: {
  orderNumber: string
  customerEmail: string
  customerName: string
  items: Array<{
    item_number: string
    description: string
    quantity: number
  }>
  deliveryDate: string
  notes?: string
}) {
  try {
    await resend.emails.send({
        from: "jaadbarg@gmail.com", // Use a verified sender email (or your preferred sender)
        to: "jaadbarg@gmail.com",//   to: orderDetails.customerEmail,
      subject: `Order Received #${orderDetails.orderNumber}`,
      html: `
        <h1>Thank you for your order!</h1>
        <p>Dear ${orderDetails.customerName},</p>
        <p>We've received your order #${orderDetails.orderNumber}. Our team will review it shortly.</p>
        
        <h2>Order Details:</h2>
        <ul>
          ${orderDetails.items.map(item => `
            <li>${item.quantity}x ${item.item_number} - ${item.description}</li>
          `).join('')}
        </ul>
        
        <p><strong>Requested Delivery Date:</strong> ${orderDetails.deliveryDate}</p>
        ${orderDetails.notes ? `<p><strong>Notes:</strong> ${orderDetails.notes}</p>` : ''}
        
        <p>You'll receive another email once your order has been confirmed.</p>
        
        <p>Best regards,<br>American Wholesalers Team</p>
      `
    })
  } catch (error) {
    console.error('Error sending confirmation email:', error)
  }
}

// Notification to admin team about new order
export async function sendNewOrderNotificationToAdmin(orderDetails: {
  orderNumber: string
  customerEmail: string
  customerName: string
  items: Array<{
    item_number: string
    description: string
    quantity: number
  }>
  deliveryDate: string
  notes?: string
}) {
  try {
    await resend.emails.send({
        from: "jaadbarg@gmail.com", // Use a verified sender email (or your preferred sender)
      to: ADMIN_EMAILS,
      subject: `🔔 New Order #${orderDetails.orderNumber} Requires Approval`,
      html: `
        <h1>New Order Requires Your Approval</h1>
        <p><strong>Order #${orderDetails.orderNumber}</strong></p>
        
        <h2>Customer Information:</h2>
        <p>Name: ${orderDetails.customerName}</p>
        <p>Email: ${orderDetails.customerEmail}</p>
        
        <h2>Order Details:</h2>
        <ul>
          ${orderDetails.items.map(item => `
            <li>${item.quantity}x ${item.item_number} - ${item.description}</li>
          `).join('')}
        </ul>
        
        <p><strong>Requested Delivery Date:</strong> ${orderDetails.deliveryDate}</p>
        ${orderDetails.notes ? `<p><strong>Notes:</strong> ${orderDetails.notes}</p>` : ''}
        
        <p style="color: red;"><strong>Action Required:</strong> Please log in to the admin panel to review and confirm this order.</p>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders" style="display: inline-block; padding: 10px 20px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
          Review Order Now
        </a>
      `
    })
  } catch (error) {
    console.error('Error sending admin notification:', error)
  }
}

// Confirmation to customer after admin approves
export async function sendOrderApprovalEmail(orderDetails: {
  orderNumber: string
  customerEmail: string
  customerName: string
  items: Array<{
    item_number: string
    description: string
    quantity: number
  }>
  deliveryDate: string
  notes?: string
}) {
  try {
    await resend.emails.send({
        from: "jaadbarg@gmail.com", // Use a verified sender email (or your preferred sender)
        to: "jaadbarg@gmail.com",//   to: orderDetails.customerEmail,
      subject: `Order Confirmed #${orderDetails.orderNumber}`,
      html: `
        <h1>Your Order is Confirmed!</h1>
        <p>Dear ${orderDetails.customerName},</p>
        <p>Great news! Your order #${orderDetails.orderNumber} has been confirmed and will be delivered as requested.</p>
        
        <h2>Order Details:</h2>
        <ul>
          ${orderDetails.items.map(item => `
            <li>${item.quantity}x ${item.item_number} - ${item.description}</li>
          `).join('')}
        </ul>
        
        <p><strong>Confirmed Delivery Date:</strong> ${orderDetails.deliveryDate}</p>
        ${orderDetails.notes ? `<p><strong>Notes:</strong> ${orderDetails.notes}</p>` : ''}
        
        <p>Thank you for choosing American Wholesalers!</p>
        
        <p>Best regards,<br>American Wholesalers Team</p>
      `
    })
  } catch (error) {
    console.error('Error sending approval email:', error)
  }
}