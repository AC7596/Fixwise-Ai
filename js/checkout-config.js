// ========================================
// FIXWISE AI — HOSTED CHECKOUT CONFIGURATION
// ========================================
//
// FIXWISE AI FOUNDING MEMBER MONTHLY PLAN ($9.99/month recurring subscription)
// Hosted PayPal Subscription URL:
// https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-3UR170892E856923CNKQ2DVI
//
// SECURITY NOTICE:
// - Do NOT put secret API keys, client secrets, passwords, or private credentials in this file
//   or anywhere in client-side code.
// - Payment Links / Hosted Checkouts are safe because they redirect the customer
//   to a secure payment page hosted by your payment provider (PayPal).

export const HOSTED_CHECKOUT_URL = "https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-3UR170892E856923CNKQ2DVI";

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
