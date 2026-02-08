"use client";

import { useCallback, useEffect, useState } from "react";
import { useTamboContext } from "@/hooks/use-tambo-context";

type SetTamboStateAction<T> = T | ((previous: T) => T);

export interface UseTamboStateOptions {
  storageKey?: string;
  contextName?: string;
  syncToContext?: boolean;
}

function readStoredState<T>(storageKey: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * React state with optional persistence + automatic Tambo context sync.
 */
export function useTamboState<T>(
  initialValue: T,
  options: UseTamboStateOptions = {},
): readonly [T, (next: SetTamboStateAction<T>) => void] {
  const { storageKey, contextName, syncToContext = Boolean(contextName) } =
    options;

  const [state, setState] = useState<T>(() => {
    if (!storageKey) {
      return initialValue;
    }
    return readStoredState(storageKey, initialValue);
  });

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey]);

  useTamboContext(contextName || storageKey || "clientState", state, {
    enabled: syncToContext,
  });

  const setTamboState = useCallback((next: SetTamboStateAction<T>) => {
    setState((previous) => {
      if (typeof next === "function") {
        return (next as (prev: T) => T)(previous);
      }
      return next;
    });
  }, []);

  return [state, setTamboState] as const;
}
