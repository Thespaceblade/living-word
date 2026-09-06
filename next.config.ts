import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/read/:slug/:chapter",
        destination: "/read/kjv/:slug/:chapter",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
