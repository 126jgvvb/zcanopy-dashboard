import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // These React 19 stylistic rules block legitimate data-fetching
      // patterns (loading state inside effects, ref assignment during
      // render) used throughout this admin dashboard.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs-during-render": "off",
      "react-hooks/use-memo": "off",
      // The gateway payloads are loosely typed throughout this console, and
      // every response is decrypted at runtime, so `any` is used widely.
      "@typescript-eslint/no-explicit-any": "off",
      // API responses carry customer PII, NINs and wallet balances: they must
      // never be written to the browser console.
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
