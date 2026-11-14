import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "hyperframes",
    "puppeteer-core",
    "@ffmpeg-installer/ffmpeg",
    "@ffprobe-installer/ffprobe",
  ],
};

export default nextConfig;
