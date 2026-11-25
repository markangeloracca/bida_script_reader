"use client";

import { createContext, useContext, type ReactNode } from "react";
import { createBrowserScriptService, type ScriptService } from "@/lib/storage";

/**
 * Defers creating the browser service until first use, so components can
 * grab it during render while IndexedDB is only touched in effects/handlers.
 */
function lazy(factory: () => ScriptService): ScriptService {
  let instance: ScriptService | undefined;
  return new Proxy({} as ScriptService, {
    get(_target, prop: keyof ScriptService) {
      instance ??= factory();
      const value = instance[prop];
      return typeof value === "function" ? value.bind(instance) : value;
    },
  });
}

const ScriptServiceContext = createContext<ScriptService>(lazy(createBrowserScriptService));

/** Injects a script service (Dependency Inversion); defaults to the IndexedDB-backed one. */
export function ScriptServiceProvider({ children, service }: { children: ReactNode; service?: ScriptService }) {
  if (!service) return children;
  return <ScriptServiceContext.Provider value={service}>{children}</ScriptServiceContext.Provider>;
}

export function useScriptService(): ScriptService {
  return useContext(ScriptServiceContext);
}
