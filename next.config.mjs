/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lean deploy artifact for Azure App Service (GitHub Actions zips `.next/standalone`).
  output: "standalone",
};

export default nextConfig;
