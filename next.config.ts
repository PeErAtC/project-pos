// next.config.js
module.exports = {
  output: 'export', // กำหนดให้เป็น static export
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // ปิดการใช้งาน Image Optimization ในการ export
  },
};
