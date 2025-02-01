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
];

export default [
  // Merge base Next + Typescript configs
  ...compat.config({
    extends: [
      "next/core-web-vitals",
      "next/typescript", 
    ],
    rules: {
      // Disable any rules you don't want
      "react/no-unescaped-entities": "off",
      "@next/next/no-page-custom-font": "off",
      
      // Allows usage of `any`
      "@typescript-eslint/no-explicit-any": "off",
    },
  }),
];

export default eslintConfig;
