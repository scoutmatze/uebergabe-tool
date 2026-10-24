import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // MUSS bleiben, sonst schlägt der Docker-Build fehl (bekannte Reisekosten-Regel).
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
