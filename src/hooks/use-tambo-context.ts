"use client";

import { useTamboContextHelpers } from "@tambo-ai/react";
import { useEffect, useRef } from "react";

export interface UseTamboContextOptions {
  enabled?: boolean;
}

/**
 * Registers dynamic context for Tambo requests using the SDK context helper API.
 * Context stays up-to-date without re-registering the helper on every render.
 */
export function useTamboContext(
  name: string,
  contextValue: unknown,
  options: UseTamboContextOptions = {},
): void {
  const { enabled = true } = options;
  const { addContextHelper, removeContextHelper } = useTamboContextHelpers();
  const contextRef = useRef(contextValue);

  useEffect(() => {
    contextRef.current = contextValue;
  }, [contextValue]);

  useEffect(() => {
    if (!enabled || !name.trim()) {
      return;
    }

    addContextHelper(name, () => contextRef.current ?? null);
    return () => {
      removeContextHelper(name);
    };
  }, [addContextHelper, enabled, name, removeContextHelper]);
}
