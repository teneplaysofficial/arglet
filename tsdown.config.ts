import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./index.ts",
  format: ["esm", "cjs"],
  minify: true,
  dts: true,
  exports: true,
});
