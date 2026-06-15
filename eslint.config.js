import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  // Global ignores MUST be the sole key in their config object, or they stop
  // being global (the sc-app/strudeldirt submodules would get linted).
  { ignores: ["dist", "src-tauri", "sc-app", "strudeldirt"] },
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
      // Dynamic OSC args and bound control/display values are stringified for
      // logs and UI; their static types are broad (OscArg, unknown), so this
      // rule is noise here.
      "@typescript-eslint/no-base-to-string": "off",
    },
  },
  // Node-side tooling: the CDP harness script (node + browser globals it drives).
  {
    files: ["scripts/**/*.{js,mjs}"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  // CommonJS config files (e.g. postcss.config.cjs).
  {
    files: ["**/*.cjs"],
    languageOptions: { sourceType: "commonjs", globals: globals.node },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  // JS/config files aren't part of any tsconfig — no type-aware linting.
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
