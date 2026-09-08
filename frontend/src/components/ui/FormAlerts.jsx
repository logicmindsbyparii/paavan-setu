import React from 'react';
import { Alert } from '@mui/material';

/**
 * Renders error and/or success alerts with a dismiss handler.
 * Replaces the identical `{error && <Alert .../>}` block repeated in every
 * admin management page.
 */
export default function FormAlerts({ error, success, onDismissError, onDismissSuccess, mb = 2 }) {
  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb, borderRadius: 2 }} onClose={onDismissError}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb, borderRadius: 2 }} onClose={onDismissSuccess}>
          {success}
        </Alert>
      )}
    </>
  );
}
