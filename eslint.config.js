import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import lit from "eslint-plugin-lit";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  // `yarn lint` targets `src packages` (see package.json), so only build output
  // under those needs ignoring — node_modules is ignored by default.
  { ignores: ["**/dist"] },
  { linterOptions: { reportUnusedDisableDirectives: "error" } },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        // Type-aware linting: resolve each file's tsconfig automatically.
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      // `any` is allowed here (osc-js/strudel interop, test stubs), so the
      // type-aware `no-unsafe-*` family that flags every any-flow is off to
      // match. The high-value correctness rules (no-floating-promises,
      // no-misused-promises, await-thenable, require-await, …) stay on.
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },
  // postcss.config.cjs is the only non-TS file in scope: CommonJS, not part of
  // any tsconfig, so no type-aware linting.
  {
    files: ["**/*.cjs"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { sourceType: "commonjs", globals: globals.node },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  // The Lit web components live under sc-elements + the ui-components package's
  // lit/ folder — lint their html`` templates.
  {
    files: ["src/sc-elements/**/*.ts", "packages/ui-components/src/components/lit/**/*.ts"],
    extends: [lit.configs["flat/recommended"]],
  },
  // Last: turn off any lint rules that would conflict with Prettier formatting.
  eslintConfigPrettier,
);
