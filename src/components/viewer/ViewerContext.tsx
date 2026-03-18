"use client";

import { createContext, useContext, useRef, useCallback, type ReactNode } from "react";
import type { StudySummary } from "@/lib/types";

export interface NavigateParams {
  seriesUID: string;
  instanceIndex: number;
  ww: number;
  wc: number;
  annotations: boolean;
}

type NavigateCallback = (params: NavigateParams) => void;

interface ViewerContextValue {
  /** Called by teaching panel to navigate the viewer */
  navigateTo: (params: NavigateParams) => void;
  /** Called by viewer to register its navigation handler */
  registerHandler: (handler: NavigateCallback) => void;
  /** Called by viewer to unregister on cleanup */
  unregisterHandler: () => void;
  /** Study data for resolving series/instance UIDs to indices */
  study: StudySummary;
}

const ViewerCtx = createContext<ViewerContextValue | null>(null);

export function ViewerProvider({
  study,
  children,
}: {
  study: StudySummary;
  children: ReactNode;
}) {
  const handlerRef = useRef<NavigateCallback | null>(null);

  const registerHandler = useCallback((handler: NavigateCallback) => {
    handlerRef.current = handler;
  }, []);

  const unregisterHandler = useCallback(() => {
    handlerRef.current = null;
  }, []);

  const navigateTo = useCallback((params: NavigateParams) => {
    if (handlerRef.current) {
      handlerRef.current(params);
    }
  }, []);

  return (
    <ViewerCtx.Provider value={{ navigateTo, registerHandler, unregisterHandler, study }}>
      {children}
    </ViewerCtx.Provider>
  );
}

export function useViewer() {
  return useContext(ViewerCtx);
}
