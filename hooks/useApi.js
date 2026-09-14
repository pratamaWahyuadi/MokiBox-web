"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useApi — wrapper ringan untuk panggil fungsi API adapter dari komponen.
 * Return: { data, loading, error, refetch }
 *
 * @param {(...args: any[]) => Promise<{ data?: any, pagination?: any, status?: number }>} fn
 * @param {any[]} deps
 */
export function useApi(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async (...args) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fnRef.current(...args);
      setState({ data: res, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, refetch: run };
}
