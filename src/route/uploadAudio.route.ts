import express from "express";
import { authenticationMiddleware } from "../middleware/auth.middleware";
import { uploadAudio } from "../controller/openAIChatIntegration.controller";
import audioUpload from "../middleware/audioUpload.middleware";
const stripeRouter = express.Router();

stripeRouter.post("/audio",authenticationMiddleware,audioUpload.single("file"),uploadAudio);


export default stripeRouter;
