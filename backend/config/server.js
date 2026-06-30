export const serverConfig = {
  port: process.env.PORT || 5000,
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  maxUploadSize: 25 * 1024 * 1024,
  maxSongs: 24
};
