import type { NextConfig } from "next";
import { basePath } from "./src/base-path";

// GitHub Pages serves this as a project page at
// davidholyko.github.io/res-gen-3, not from the domain root, so every
// asset/link needs the repo name prefixed -- and there's no server to run
// Next's Image Optimization API against, so it's disabled in favor of
// serving the source files as-is.
const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: `${basePath}/`,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
