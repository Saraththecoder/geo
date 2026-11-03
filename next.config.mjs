/** @type {import('next').NextConfig} */

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://www.gstatic.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com;
  img-src 'self' blob: data: https://*.tile.openstreetmap.org https://lh3.googleusercontent.com https://unpkg.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.firebaseio.com wss://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://fcmregistrations.googleapis.com https://router.project-osrm.org http://127.0.0.1:* ws://127.0.0.1:*;
  frame-src 'self' https://*.firebaseapp.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  worker-src 'self' blob:;
  manifest-src 'self';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  {
    key: "Content-Security-Policy",
    value: cspHeader,
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    ALLOWED_EMAIL_DOMAIN: process.env.ALLOWED_EMAIL_DOMAIN || "aits.edu",
    NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN:
      process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN ||
      process.env.ALLOWED_EMAIL_DOMAIN ||
      "aits.edu",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

