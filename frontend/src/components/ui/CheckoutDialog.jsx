import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Alert, CircularProgress, Box, Typography
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { motion } from 'framer-motion';

import { startCheckout } from '../../lib/razorpay';
import { colors as T } from '../../constants/tokens';

/* ─── CHECKOUT DIALOG ─────────────────────────────────────────────────────── */
/* Razorpay needs a name and contact number, so we collect them before opening
   the payment modal rather than asking Razorpay to. */
export default function CheckoutDialog({ book, onClose }) {
  var [form, setForm] = useState({ name: '', phone: '', email: '' });
  var [status, setStatus] = useState({ state: 'idle', message: '' });

  if (!book) return null;

  var busy = status.state === 'paying';
  var phoneOk = /^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, '').slice(-10));
  var canPay = form.name.trim().length > 1 && phoneOk && !busy;

  function field(name) {
    return {
      value: form[name],
      onChange: function (e) {
        setForm(Object.assign({}, form, { [name]: e.target.value }));
      },
      disabled: busy,
      fullWidth: true,
      size: 'small',
    };
  }

  function pay() {
    setStatus({ state: 'paying', message: '' });
    startCheckout({
      items: [{ bookId: book.id, quantity: 1 }],
      customer: {
        name: form.name.trim(),
        phone: form.phone.replace(/\D/g, '').slice(-10),
        email: form.email.trim(),
      },
      onSuccess: function (order) {
        setStatus({
          state: 'done',
          message: 'Payment received. Your order number is ' + order.orderNumber + '.',
        });
      },
      onError: function (message) {
        setStatus({ state: 'error', message: message });
      },
      onDismiss: function () {
        setStatus({ state: 'idle', message: '' });
      },
    });
  }

  var done = status.state === 'done';

  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontFamily: "'DM Serif Display',Georgia,serif", fontWeight: 600, pb: 0.5 }}>
        {done ? 'Thank you!' : 'Buy ' + book.title}
      </DialogTitle>

      <DialogContent sx={{ pt: '12px !important' }}>
        {done ? (
          <Alert severity="success" sx={{ mb: 1 }}>{status.message}</Alert>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 2.5 }}>
              <Typography sx={{ color: T.ash, fontSize: '0.85rem' }}>Total</Typography>
              <Typography sx={{
                fontFamily: "'DM Serif Display',Georgia,serif", fontWeight: 700,
                fontSize: '1.5rem', color: book.accentCol, ml: 'auto',
              }}>
                ₹{book.price}
              </Typography>
            </Box>

            {status.state === 'error' && (
              <Alert severity="error" sx={{ mb: 2 }}>{status.message}</Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField {...field('name')} label="Full name" required autoFocus />
              <TextField
                {...field('phone')}
                label="Phone number"
                required
                error={form.phone.length > 0 && !phoneOk}
                helperText={form.phone.length > 0 && !phoneOk ? '10-digit Indian mobile number' : ' '}
              />
              <TextField {...field('email')} label="Email (optional)" type="email" />
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        {done ? (
          <Button onClick={onClose} variant="contained"
            sx={{ bgcolor: T.green, borderRadius: 50, px: 3, '&:hover': { bgcolor: T.blue } }}>
            Done
          </Button>
        ) : (
          <>
            <Button onClick={onClose} disabled={busy} sx={{ color: T.ash }}>Cancel</Button>
            <motion.div whileHover={canPay && !busy ? { scale: 1.05 } : {}} whileTap={canPay && !busy ? { scale: 0.95 } : {}}>
              <Button
                onClick={pay}
                disabled={!canPay}
                variant="contained"
                startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <ShoppingCartIcon />}
                sx={{ 
                  bgcolor: T.green, 
                  borderRadius: 50, 
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  boxShadow: '0 10px 25px rgba(10, 79, 34, 0.3)',
                  transition: 'background-color 0.3s ease',
                  '&:hover': { bgcolor: T.blue, boxShadow: '0 15px 35px rgba(23, 74, 114, 0.4)' } 
                }}
              >
                {busy ? 'Opening…' : 'Pay ₹' + book.price}
              </Button>
            </motion.div>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
