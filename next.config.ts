import type { NextConfig } from "next";

const CORS_HEADERS = [
  {
    key: "Access-Control-Allow-Origin",
    value: "*",
  },
  {
    key: "Access-Control-Allow-Methods",
    value: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  },
  {
    key: "Access-Control-Allow-Headers",
    value: "Content-Type,Authorization",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: CORS_HEADERS,
      },
      {
        source: "/uploads/:path*",
        headers: CORS_HEADERS,
      },
    ];
  },
};

export default nextConfig;
