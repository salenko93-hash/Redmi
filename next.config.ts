import type { NextConfig } from "next";
import { developmentOrigins } from "./lib/site-origin";
const config: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: developmentOrigins(process.env.APP_URL),
  devIndicators: false,
  serverExternalPackages: ["bcryptjs"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default config;
