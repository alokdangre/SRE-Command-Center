"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTamboContext } from "@/hooks/use-tambo-context";
import { useTamboState } from "@/hooks/use-tambo-state";
import {
  MODEL_SELECTION_STORAGE_KEY,
  readModelSelection,
  type ModelSelection,
} from "@/lib/model-selection";

const TAMBO_RUNTIME_STATE_STORAGE_KEY = "sre.tambo.runtime-state.v1";

interface TamboRuntimeState {
  activeIncidentId: string;
  chatPanelOpen: boolean;
  route: string;
  lastUpdatedAt: string;
}

interface TamboUserPreferences {
  locale: string;
  timezone: string;
  prefersReducedMotion: boolean;
  modelSelection: ModelSelection;
}

interface TamboRuntimeContextProps {
  incidentId: string;
  isChatOpen: boolean;
}

function readUserPreferences(): TamboUserPreferences {
  const locale =
    typeof navigator !== "undefined" ? navigator.language : "en-US";
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return {
    locale,
    timezone,
    prefersReducedMotion,
    modelSelection: readModelSelection(),
  };
}

/**
 * Syncs app runtime state + user preferences into Tambo request context.
 */
export function TamboRuntimeContext({
  incidentId,
  isChatOpen,
}: TamboRuntimeContextProps) {
  const pathname = usePathname();
  const [runtimeState, setRuntimeState] = useTamboState<TamboRuntimeState>(
    {
      activeIncidentId: incidentId,
      chatPanelOpen: isChatOpen,
      route: pathname ?? "/sre",
      lastUpdatedAt: new Date().toISOString(),
    },
    {
      storageKey: TAMBO_RUNTIME_STATE_STORAGE_KEY,
      contextName: "sreRuntimeState",
      syncToContext: true,
    },
  );
  const [preferences, setPreferences] = useState<TamboUserPreferences>(() =>
    readUserPreferences(),
  );

  useEffect(() => {
    setRuntimeState((previous) => {
      const nextRoute = pathname ?? previous.route;
      const isUnchanged =
        previous.activeIncidentId === incidentId &&
        previous.chatPanelOpen === isChatOpen &&
        previous.route === nextRoute;

      if (isUnchanged) {
        return previous;
      }

      return {
        activeIncidentId: incidentId,
        chatPanelOpen: isChatOpen,
        route: nextRoute,
        lastUpdatedAt: new Date().toISOString(),
      };
    });
  }, [incidentId, isChatOpen, pathname, setRuntimeState]);

  useEffect(() => {
    const syncPreferences = () => {
      setPreferences(readUserPreferences());
    };

    syncPreferences();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === MODEL_SELECTION_STORAGE_KEY) {
        syncPreferences();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useTamboContext("userPreferences", preferences);
  useTamboContext("sreSession", {
    incidentId: runtimeState.activeIncidentId,
    route: runtimeState.route,
  });

  return null;
}
