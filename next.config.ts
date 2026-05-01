import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nessuna API key esposta al frontend
  // Le env vars senza NEXT_PUBLIC_ restano server-side
};

export default nextConfig;
