import { NextResponse } from 'next/server'

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  🎯 PAYMENT GATEWAY STATUS CHECK                                       ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                          ║
 * ║  This route checks if the Razorpay payment gateway is configured.        ║
 * ║                                                                          ║
 * ║  To enable payments, set these in your .env file:                       ║
 * ║    NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_live_XXXXXXXXXXXX"               ║
 * ║    RAZORPAY_KEY_SECRET        = "XXXXXXXXXXXXXXXXXXXXXXXX"              ║
 * ║    PAYMENT_GATEWAY_ENABLED   = "true"                                  ║
 * ║                                                                          ║
 * ║  When all three are set correctly, this returns { configured: true }     ║
 * ║  and the "Pay Now" button will appear in the PaymentDialog.             ║
 * ║                                                                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// GET /api/payments/check - Check if payment gateway is configured
export async function GET() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  const gatewayEnabled = process.env.PAYMENT_GATEWAY_ENABLED === 'true'

  // Gateway is configured only when all three conditions are met
  const configured = !!(
    keyId &&
    !keyId.includes('XXXX') &&
    keySecret &&
    keySecret !== 'XXXXXXXXXXXXXXXXXXXXXXXX' &&
    gatewayEnabled
  )

  return NextResponse.json({ configured })
}
