/** @type {import('next').NextConfig} */
const supabaseStoragePattern = (() => {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
    return {
      protocol: url.protocol.slice(0, -1),
      hostname: url.hostname,
      port: url.port,
      pathname: "/storage/v1/object/**",
    };
  } catch {
    return null;
  }
})();

const nextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: supabaseStoragePattern ? [supabaseStoragePattern] : [],
  },
};

export default nextConfig;
