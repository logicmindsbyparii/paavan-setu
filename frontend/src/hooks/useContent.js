/**
 * Content hooks.
 *
 * Each hook returns the bundled fallback until the API responds, and keeps the
 * fallback if the API is unreachable — so the site never renders an empty page.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { getBooks, getSettings } from '../lib/api';

function useResource(fetcher, fallback, key) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Held in refs so changing identity between renders does not refetch.
  const fetcherRef = useRef(fetcher);
  const fallbackRef = useRef(fallback);
  fetcherRef.current = fetcher;
  fallbackRef.current = fallback;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetcherRef.current()
      .then((result) => {
        if (cancelled) return;
        // An empty collection from a fresh database should not blank the page.
        const isEmpty = Array.isArray(result) ? result.length === 0 : !result;
        setData(isEmpty && fallbackRef.current ? fallbackRef.current : result);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Falling back to bundled content:', err.message);
        setData(fallbackRef.current);
        setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [key]);

  return { data, loading, error };
}

export function useBooks(fallback = [], params) {
  const key = JSON.stringify(params || {});
  return useResource(() => getBooks(params), fallback, key);
}

export function useSettings(fallback = {}) {
  const { data, loading, error } = useResource(getSettings, fallback, 'settings');

  // Merges API values over the bundled fallback, so a key that has not been
  // set in the admin panel still resolves to a sensible default.
  const get = useCallback(
    (key, defaultValue = '') => {
      const value = data?.[key];
      if (value === undefined || value === null || value === '') {
        return fallback?.[key] ?? defaultValue;
      }
      return value;
    },
    [data, fallback]
  );

  return { settings: data, get, loading, error };
}
