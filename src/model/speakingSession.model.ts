import { object } from "joi";
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  user: {
    audioFile: { type: String },         // user uploaded audio file URL/path
    transcription: { type: String },     // speech-to-text result
  },
  assistant: {
    content: { type: String },           // AI text reply
    audioFile: { type: String },         // AI-generated audio file
    feedback: { type: Object },          // AI/teacher feedback
  },
  timestamp: { type: Date, default: Date.now },
});

const speakingChatSchema = new mongoose.Schema({
  moduleId: { type: mongoose.Types.ObjectId, ref: "Module", required: true },
  userId: { type: mongoose.Types.ObjectId, ref: "User" },
  messages: [messageSchema], // array of user+AI exchanges
});

export const SpeakingSessionModel = mongoose.model("SpeakingChat", speakingChatSchema);
