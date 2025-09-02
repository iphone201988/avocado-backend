import { Request, Response } from "express";
import fs from "fs";
import OpenAI from "openai";
import { SpeakingSessionModel } from "../model/speakingSession.model";
import path from "path";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const handleSpeaking = async (req: any, res: Response): Promise<any> => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No audio uploaded" });
  }

  const { moduleId } = req.body;
  const userId = req.userId;
  const filePath = req.file.path;

  try {
    // --- Step 1: Transcribe user audio ---
    const transcriptionRes = await client.audio.transcriptions.create({
      model: "gpt-4o-mini-transcribe",
      file: fs.createReadStream(filePath),
    });
    const userText = transcriptionRes.text.trim();
    console.log(userText)

    // --- Step 2: Fetch session for context ---
    let session = await SpeakingSessionModel.findOne({ moduleId, userId });

    const history:any = session
      ? session.messages.map((m) => [
          { role: "user", content: m.user.transcription },
          { role: "assistant", content: m.assistant.content },
        ]).flat()
      : [];

    // --- Step 3: Generate structured feedback (only latest message) ---
    const feedbackRes = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a strict evaluator. Analyze ONLY the user's latest response and return JSON scores (1–5) for each category.

Return ONLY valid JSON in this format:
{
  "relevance": number,
  "vocabulary": number,
  "fluency": number,
  "pronunciation": number,
  "structure": number
}`,
        },
        { role: "user", content: userText },
      ],
      response_format: { type: "json_object" },
    });

    const feedback = JSON.parse(feedbackRes.choices[0].message?.content || "{}");

    // --- Step 4: Generate AI reply (considering history) ---
    const replyRes = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a friendly tutor. Respond briefly and naturally to continue the conversation.",
        },
        ...history,
        { role: "user", content: userText },
      ],
    });

    const aiReply = replyRes.choices?.[0]?.message?.content?.trim() || "I couldn’t generate a reply.";

    // --- Step 5: Convert reply → speech ---
    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: aiReply,
    });
    const audioBuffer = Buffer.from(await speech.arrayBuffer());

    // Save AI reply audio
    const replyAudioFilename = `reply-${Date.now()}.mp3`;
    const replyAudioPath = path.join("uploads", replyAudioFilename);
    fs.writeFileSync(replyAudioPath, audioBuffer);

    // --- Step 6: Build URLs ---
    const userAudioUrl = `${process.env.SERVER_URL}/uploads/${path.basename(filePath)}`;
    const replyAudioUrl = `${process.env.SERVER_URL}/uploads/${replyAudioFilename}`;

    // --- Step 7: Build combined message ---
    const message = {
      user: {
        audioFile: userAudioUrl,
        transcription: userText,
      },
      assistant: {
        content: aiReply,
        audioFile: replyAudioUrl,
        feedback, // now JSON scores
      },
      timestamp: new Date(),
    };

    // --- Step 8: Save session ---
    if (session) {
      session.messages.push(message);
      await session.save();
    } else {
      session = await SpeakingSessionModel.create({
        moduleId,
        userId,
        messages: [message],
      });
    }

    // --- Step 9: Respond ---
    res.json({
      success: true,
      sessionId: session._id,
      message,
    });
  } catch (err: any) {
    console.error("❌ Speaking API Error:", err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: "Processing failed",
      error: err.response?.data || err.message,
    });
  }
};
