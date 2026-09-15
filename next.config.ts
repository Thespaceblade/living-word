import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "1";
const basePath = isGithubPages ? "/living-word" : "";

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : undefined,
  trailingSlash: isGithubPages ? true : undefined,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_STATIC_EXPORT: isGithubPages ? "1" : "",
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  ...(isGithubPages
    ? {}
    : {
        async redirects() {
          return [
            {
              source: "/read/:slug/:chapter",
              destination: "/read/kjv/:slug/:chapter",
              permanent: false,
            },
          ];
        },
      }),
};

export default nextConfig;
