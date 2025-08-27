import { Request, Response, NextFunction } from 'express';
import { SUCCESS } from '../utils/helper';


export const    uploadAudio = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  res.json({
    success: true,
    filename: req.file.filename,
    path: `/uploads/audio/${req.file.filename}`,
  });
};