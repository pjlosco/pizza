import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://web.squarecdn.com; frame-src 'self' https://web.squarecdn.com https://pci-connect.squareup.com; connect-src 'self' https://web.squarecdn.com https://pci-connect.squareup.com https://connect.squareup.com https://connect.squareupsandbox.com; style-src 'self' 'unsafe-inline' https://web.squarecdn.com; img-src 'self' data: https:; font-src 'self' data: https://web.squarecdn.com;"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
