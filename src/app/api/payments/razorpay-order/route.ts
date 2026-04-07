import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  🎯 RAZORPAY ORDER — ADD YOUR RAZORPAY CODE HERE                       ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                          ║
 * ║  This API route creates a Razorpay order when a user clicks "Pay Now".  ║
 * ║                                                                          ║
 * ║  📋 SETUP INSTRUCTIONS:                                                 ║
 * ║                                                                          ║
 * ║  1. Install Razorpay SDK (if not already):                              ║
 * ║     bun add razorpay                                                    ║
 * ║                                                                          ║
 * ║  2. Add your Razorpay keys to .env file:                                ║
 * ║     NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_live_XXXXXXXXXXXX"               ║
 * ║     RAZORPAY_KEY_SECRET        = "XXXXXXXXXXXXXXXXXXXXXXXX"              ║
 * ║     PAYMENT_GATEWAY_ENABLED   = "true"                                  ║
 * ║                                                                          ║
 * ║  3. Replace the placeholder code below with your Razorpay integration:  ║
 * ║                                                                          ║
 * ║     import Razorpay from 'razorpay'                                     ║
 * ║                                                                          ║
 * ║     const razorpay = new Razorpay({                                     ║
 * ║       key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,                  ║
 * ║       key_secret: process.env.RAZORPAY_KEY_SECRET,                      ║
 * ║     })                                                                  ║
 * ║                                                                          ║
 * ║     const order = await razorpay.orders.create({                        ║
 * ║       amount: Math.round(Number(amount) * 100), // Amount in paise      ║
 * ║       currency: 'INR',                                                  ║
 * ║       receipt: `rcpt_${userId}_${Date.now()}`,                          ║
 * ║       notes: { userId },                                                ║
 * ║     })                                                                  ║
 * ║                                                                          ║
 * ║  4. Store order in Payment table and return:                            ║
 * ║     { success: true, data: { orderId, amount, currency, key } }         ║
 * ║                                                                          ║
 * ║  💡 TIP: Get your keys from https://dashboard.razorpay.com/api-keys    ║
 * ║                                                                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// POST /api/payments/razorpay-order - Create a Razorpay order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, userId } = body

    if (!amount || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: amount, userId' },
        { status: 400 }
      )
    }

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║  🎯 RAZORPAY INTEGRATION POINT                                  ║
    // ║                                                                  ║
    // ║  Replace this section with your Razorpay order creation code.   ║
    // ║                                                                  ║
    // ║  Example:                                                        ║
    // ║    import Razorpay from 'razorpay'                               ║
    // ║                                                                  ║
    // ║    const razorpay = new Razorpay({                               ║
    // ║      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,          ║
    // ║      key_secret: process.env.RAZORPAY_KEY_SECRET!,              ║
    // ║    })                                                            ║
    // ║                                                                  ║
    // ║    const order = await razorpay.orders.create({                  ║
    // ║      amount: Math.round(Number(amount) * 100),                  ║
    // ║      currency: 'INR',                                            ║
    // ║      receipt: `rcpt_${userId}_${Date.now()}`,                    ║
    // ║    })                                                            ║
    // ║                                                                  ║
    // ║    // Store order in DB                                          ║
    // ║    await db.payment.create({                                     ║
    // ║      data: {                                                     ║
    // ║        userId,                                                   ║
    // ║        amount: Number(amount),                                   ║
    // ║        currency: 'INR',                                          ║
    // ║        status: 'pending',                                        ║
    // ║        paymentMethod: 'razorpay',                                ║
    // ║        razorpayOrderId: order.id,                                ║
    // ║        description: `Payment for subscription - ₹${amount}`,     ║
    // ║      },                                                          ║
    // ║    })                                                            ║
    // ║                                                                  ║
    // ║    return NextResponse.json({                                   ║
    // ║      success: true,                                              ║
    // ║      data: {                                                     ║
    // ║        orderId: order.id,                                        ║
    // ║        amount: Number(amount),                                   ║
    // ║        currency: 'INR',                                          ║
    // ║        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,             ║
    // ║      },                                                          ║
    // ║    })                                                            ║
    // ╚══════════════════════════════════════════════════════════════════╝

    // Placeholder: Check if gateway is configured
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    const gatewayEnabled = process.env.PAYMENT_GATEWAY_ENABLED === 'true'

    if (!keyId || !keySecret || !gatewayEnabled) {
      return NextResponse.json(
        {
          success: false,
          error: 'PAYMENT_NOT_CONFIGURED',
          message: 'Payment gateway is not configured. Please set your Razorpay keys in the .env file.',
        },
        { status: 503 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎯 ADD YOUR RAZORPAY ORDER CREATION CODE HERE
    //    (See the commented example above)
    //    Replace the line below with your actual Razorpay integration.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Placeholder response — replace with your Razorpay order creation
    return NextResponse.json({
      success: false,
      error: 'PAYMENT_NOT_CONFIGURED',
      message: 'Razorpay order creation is not implemented yet. Add your code in this file.',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create order'
    console.error('Payment order creation error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
