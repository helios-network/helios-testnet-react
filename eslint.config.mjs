import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/exhaustive-deps": "warn",
      "prefer-const": "warn",
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "warn",
      "jsx-a11y/role-supports-aria-props": "off",
      "@typescript-eslint/no-empty-object-type": "off"
    }
  }
];

export default eslintConfig;
