// ========================================
// FIXWISE AI — HOSTED CHECKOUT CONFIGURATION
// ========================================
//
// INSTRUCTIONS FOR CONNECTING A REAL PAYMENT LINK:
//
// 1. Create a payment link or buy button in your payment provider
//    (e.g., Stripe Payment Link, Lemon Squeezy, PayPal, Paddle, etc.).
// 2. Copy the full public HTTPS checkout URL (e.g., https://buy.stripe.com/abc123xyz).
// 3. Paste your URL into HOSTED_CHECKOUT_URL below:
//      export const HOSTED_CHECKOUT_URL = "https://buy.stripe.com/your_payment_link";
//    OR update the <meta name="fixwise-checkout-url" content="..."> tag in index.html.
//
// SECURITY NOTICE:
// - Do NOT put secret API keys, secret tokens, or private credentials in this file
//   or anywhere in client-side code.
// - Payment Links / Hosted Checkouts are safe because they redirect the customer
//   to a secure payment page hosted by your payment provider.

export const HOSTED_CHECKOUT_URL = "";

/**
 * Resolves the hosted checkout URL from config file or index.html meta tag.
 * @returns {string} The configured checkout URL, or empty string if not configured.
 */
export function getCheckoutUrl() {
  if (typeof window !== 'undefined' && window.FIXWISE_CONFIG && window.FIXWISE_CONFIG.checkoutUrl) {
    const url = String(window.FIXWISE_CONFIG.checkoutUrl).trim();
    if (url) return url;
  }

  if (typeof document !== 'undefined') {
    const meta = document.querySelector('meta[name="fixwise-checkout-url"]');
    const content = meta && meta.getAttribute('content');
    if (content && content.trim()) return content.trim();
  }

  return HOSTED_CHECKOUT_URL.trim();
}
