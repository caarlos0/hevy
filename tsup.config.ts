import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  target: "node20",
  outDir: "dist",
  clean: true,
  banner: { js: "#!/usr/bin/env node" },
  shims: false,
  splitting: false,
  sourcemap: false,
  minify: false,
  // Bundle all deps so the output is self-contained — required for the
  // goreleaser Node SEA builder, which embeds a single .cjs file.
  noExternal: [/.*/],
});
