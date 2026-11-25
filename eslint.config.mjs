import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Architecture guardrails (see PLAN.md §1 and docs/adr):
 *   app → components → hooks → lib/store → lib/{editor, storage} → lib/fountain
 * Lower layers must never import higher ones.
 */
const UI_LAYERS = ["@/app/*", "@/components/*", "@/hooks/*"];

const restrict = (files, patterns, message) => ({
  files,
  rules: {
    "no-restricted-imports": ["error", { patterns: [{ group: patterns, message }] }],
  },
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "import/no-cycle": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
    },
  },
  restrict(
    ["lib/fountain/**"],
    ["react", "react-dom", "next", "next/*", "@codemirror/*", "@uiw/*", "idb-keyval", "@/lib/*", "@/components/*", "@/hooks/*", "@/app/*"],
    "lib/fountain is pure domain code: no React, DOM, CodeMirror, storage or app imports.",
  ),
  restrict(
    ["lib/editor/**"],
    ["react", "react-dom", "next", "next/*", "@/lib/storage", "@/lib/storage/*", "@/lib/store/*", ...UI_LAYERS],
    "lib/editor may depend on CodeMirror and lib/fountain only.",
  ),
  restrict(
    ["lib/storage/**"],
    ["react", "react-dom", "next", "next/*", "@codemirror/*", "@/lib/editor", "@/lib/store/*", ...UI_LAYERS],
    "lib/storage must not depend on UI, state or the editor.",
  ),
  restrict(["lib/store/**"], ["react-dom", "@codemirror/*", ...UI_LAYERS], "lib/store must not depend on UI layers."),
  restrict(["hooks/**"], ["@/components/*", "@/app/*"], "hooks must not import components."),
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "playwright-report/**", "test-results/**"]),
]);

export default eslintConfig;
