/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Enable strict type checking in production
    ignoreBuildErrors: false,
  },
  images: {
    // Use Next.js image optimization in production for better performance
    unoptimized: process.env.NODE_ENV === "development",
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hebbkx1anhila5yf.public.blob.vercel-storage.com",
      },
    ],
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  // Allow cross-origin requests from local network devices
  allowedDevOrigins: ["192.168.1.209"],

  // Turbopack configuration for Next.js 16
  turbopack: {
    // Configure root to avoid lockfile warnings
    root: process.cwd(),
    // SVG loader configuration for Turbopack
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },

  // Webpack config (fallback for production builds that might use webpack)
  webpack(config, { isServer }) {
    // SVG loader
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    // Tree shaking for better bundle size
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
    }

    return config;
  },
};

export default nextConfig;
