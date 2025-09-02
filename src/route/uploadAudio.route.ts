import express from "express";
import { authenticationMiddleware } from "../middleware/auth.middleware";
import { upload } from "../utils/multer";
import { handleSpeaking } from "../controller/openAIChatIntegration.controller";

const router = express.Router();

router.post(
  "/speaking",
  authenticationMiddleware, 
  upload.single("audio"),  
  handleSpeaking
);

export default router;
