/**
 * Razorpay Standard Checkout.
 *
 * The publishable key id comes back from our own create-order response, so the
 * key never has to be duplicated in the bundle. REACT_APP_RAZORPAY_KEY_ID is
 * only a fallback. The key secret lives on the server and never reaches here.
 */
import { createOrder, verifyPayment, reportPaymentFailure } from './api';

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptPromise = null;

/** Loads checkout.js once and reuses the same promise for later calls. */
export function loadCheckoutScript() {
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${CHECKOUT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay')));
      return;
    }

    const script = document.createElement('script');
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      scriptPromise = null; // Allow a retry on the next attempt.
      reject(new Error('Could not reach Razorpay. Check your connection and try again.'));
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Runs the full purchase flow: create order → open modal → verify signature.
 *
 * @param {object}   opts
 * @param {Array}    opts.items     [{ bookId, quantity }]
 * @param {object}   opts.customer  { name, phone, email? }
 * @param {function} opts.onSuccess called with the verified order
 * @param {function} opts.onError   called with a user-facing message
 * @param {function} opts.onDismiss called when the user closes the modal
 */
export async function startCheckout({
  items,
  customer,
  onSuccess = () => {},
  onError = () => {},
  onDismiss = () => {},
}) {
  try {
    await loadCheckoutScript();
  } catch (err) {
    onError(err.message);
    return;
  }

  let order;
  try {
    // The server recalculates the price from the database, so a tampered
    // client-side amount cannot change what is actually charged.
    order = await createOrder({ items, customer });
  } catch (err) {
    onError(err.message || 'Could not start checkout. Please try again.');
    return;
  }

  // `dismissed` guards against the ondismiss handler firing after a success.
  let settled = false;

  const rzp = new window.Razorpay({
    key: order.key || process.env.REACT_APP_RAZORPAY_KEY_ID,
    order_id: order.razorpayOrderId,
    amount: order.amount,
    currency: order.currency,
    name: 'Paavan Setu',
    description: items.length === 1 ? 'Book purchase' : `${items.length} books`,
    image: '/logo_final.png',
    prefill: {
      name: order.customer?.name || customer.name,
      email: order.customer?.email || customer.email || '',
      contact: order.customer?.phone || customer.phone,
    },
    notes: { orderId: order.orderId },
    theme: { color: '#0a4f22' },

    handler: async (response) => {
      settled = true;
      try {
        const verified = await verifyPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
        onSuccess(verified);
      } catch (err) {
        // Money may have left the customer's account, so never imply it is lost.
        onError(
          err.message ||
            'We could not confirm your payment. If money was debited, contact us and we will sort it out.'
        );
      }
    },

    modal: {
      ondismiss: () => {
        if (settled) return;
        settled = true;
        onDismiss();
      },
    },
  });

  rzp.on('payment.failed', (response) => {
    settled = true;
    const error = response?.error || {};
    reportPaymentFailure({
      razorpay_order_id: error.metadata?.order_id || order.razorpayOrderId,
      error,
    });
    onError(error.description || 'Payment failed. Please try another method.');
  });

  rzp.open();
}
