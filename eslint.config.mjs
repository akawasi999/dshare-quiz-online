import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import noHardcodedInternalUrl from "./server/eslint-rules/no-hardcoded-internal-url.mjs";

export default [
  { ignores: ["dist/**", "node_modules/**", "drizzle/**", "client/src/lib/routes.ts"] },
  {
    files: ["client/src/**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser, parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } } },
    plugins: { "react-hooks": reactHooks, dshare: { rules: { "no-hardcoded-internal-url": noHardcodedInternalUrl } } },
    rules: { "dshare/no-hardcoded-internal-url": "error" },
  },
];
