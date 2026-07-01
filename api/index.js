// Vercel serverless entry — strips /api prefix before passing to Express
import app from "../backend/api/index.js";

export default (req, res) => {
  req.url = req.url.replace(/^\/api/, "") || "/";
  app(req, res);
};
