import { Request, Response, NextFunction } from 'express';
import { SUCCESS } from '../utils/helper';


export const uploadAudio = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  const filePath = `/uploads/audio/${req.file.filename}`;
  const fileUrl = `${req.protocol}://${req.get("host")}${filePath}`;

  res.json({
    success: true,
    filename: req.file.filename,
    path: filePath,
    fileUrl, // full URL for frontend
  });
};