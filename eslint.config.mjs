import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // eslint-config-next の既定 ignore。
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 参照実装のスナップショット（非規範・ビルド対象外。CLAUDE.md）。
    ".reference/**",
    // OpenNext の出力と Terraform。
    ".open-next/**",
    "infra/**",
  ]),
]);

export default eslintConfig;
