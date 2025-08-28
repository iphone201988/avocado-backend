import express from "express";
import multer from "multer";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { File } from "node:buffer";
globalThis.File = File;

const router = express.Router();

// Force multer to accept only audio and keep extension
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".wav"; // default to .wav
    cb(null, file.fieldname + "-" + Date.now() + ext);
  },
});
const upload = multer({ storage });

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/speaking", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No audio file uploaded" });
  }

  const filePath = req.file.path;
  console.log("📂 Uploaded file:", filePath);

  try {
    // --- Step 1: Transcribe ---
    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
    });

    console.log("✅ Transcription received");

    const userText = transcription.text?.trim();
    if (!userText) {
      throw new Error("Failed to transcribe audio");
    }

    // --- Step 2: Generate AI Reply ---
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a friendly speaking tutor. Respond briefly to what the user said.",
        },
        { role: "user", content: userText },
      ],
    });

    const aiReply =
      response.choices?.[0]?.message?.content?.trim() ||
      "I couldn’t understand that.";

    console.log("💬 AI Reply:", aiReply);

    // --- Step 3: Convert Reply to Speech ---
    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: aiReply,
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());

    res.json({
      success: true,
      transcription: userText,
      reply: aiReply,
      audio: audioBuffer.toString("base64"),
    });
  } catch (err: any) {
    console.error("❌ Speaking API Error:", err.response?.data || err.message || err);
    res.status(500).json({
      success: false,
      message: "Processing failed",
      error: err.response?.data || err.message || "Unknown error",
    });
  } finally {
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupErr) {
      console.error("⚠️ Cleanup failed:", cleanupErr);
    }
  }
});

export default router;
