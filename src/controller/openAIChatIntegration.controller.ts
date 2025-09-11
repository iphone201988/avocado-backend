import { Request, Response } from "express";
import fs from "fs";
import OpenAI from "openai";
import { SpeakingSessionModel } from "../model/speakingSession.model";
import path from "path";
import { ModuleModel } from "../model/module.model";

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
    console.log("line21")
    console.log("file......",fs.createReadStream(filePath))
    const transcriptionRes = await client.audio.transcriptions.create({
      model: "whisper-1",  // ✅ correct model
      file: fs.createReadStream(filePath),
    });
    console.log("line22")
    const userText = transcriptionRes.text.trim();
    console.log("line28")
    console.log(userText)
    console.log("line 30")

    // --- Step 2: Fetch session for context ---
    let session = await SpeakingSessionModel.findOne({ moduleId });
    let moduleData = await ModuleModel.findById(moduleId).lean();
    console.log(moduleData)
    const history: any = session
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
          content: `You are a strict evaluator. The user is completing a speaking task.

Task details:
${JSON.stringify(moduleData, null, 2)}

Analyze ONLY the user's latest response in relation to the task above.
Return JSON scores (1–5) for each category:

- relevance: How well the response addresses the given task/topic
- vocabulary: Appropriateness and richness of word choice
- fluency: Natural flow and ease of expression
- pronunciation: Clarity and correctness of speech (based on transcription clues)
- structure: Organization and coherence of the response

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
