import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router: IRouter = Router();

const UPLOAD_DIR = "/tmp/pamir-uploads";
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm", "video/quicktime"];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";
  const url = `/api/uploads/${req.file.filename}`;
  return res.json({ url, mediaType, filename: req.file.filename });
});

router.get("/uploads/:filename", (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
  return res.sendFile(filePath);
});

export default router;
