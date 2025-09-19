import OpenAI from "openai";
import { Request, Response } from 'express';
import { ModuleModel } from "../../model/module.model";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
import { FeedbackInput } from "../builder.controller";
import { hasActiveSubscription } from "../../middleware/checkSubscription.middleware";
import ErrorHandler from "../../utils/ErrorHandler";
import { SpeakingSessionModel } from "../../model/speakingSession.model";





export const getSpeakingTaskLogic = async (
  req: Request
): Promise<{ moduleId: string }> => {


  const { topic, level, formality, style = 'defaultStyle', language = 'german' } = req.body;



  const prompt = `
You are a skilled language teacher for foreign language learners. Create a creative, open-ended speaking task for a student at level ${level}.

Details:
- Topic: ${topic}
- Formality: ${formality}
${style ? `- Style (optional): ${style}` : ''}
- Language: ${language}

The task should sound natural, encourage spontaneous speech, and invite conversation. Use casual language where appropriate.

⚠️ The task **must be written entirely in ${language}**.

Reply **only in JSON format** like this:
{
  "prompt": "<Situational or role-based speaking prompt in ${language}>"
}
  `.trim();

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      // temperature: 0.8,
      messages: [
        {
          role: 'system',
          content: `You are an assistant that generates creative speaking tasks for language learners in ${language}. Always respond in ${language}.`,
        },
        { role: 'user', content: prompt },
      ],
    });
  } catch (err) {
    console.error('OpenAI API error:', err);
    throw new Error('Failed to generate speaking prompt from AI.');
  }

  const content = completion.choices[0]?.message?.content || '';
  let data;
  try {
    data = JSON.parse(content);
  } catch (err) {
    console.error('Invalid JSON from OpenAI:', content);
    throw new Error('OpenAI returned invalid JSON.');
  }

  if (!data.prompt || typeof data.prompt !== 'string') {
    throw new Error('AI response is missing a valid "prompt" field.');
  }

  // Optionally: Check if the language matches (e.g., for "de", check if response starts in German)
  // You could use a language detector like franc or simple heuristics here if needed

  const newModule = await ModuleModel.create({
    type: 'speaking',
    task: data.prompt,
    aiFeedback: null,
    paragraph: null,
    questions: [],
    answers: [],
    comprehension: null,
  });

  const newChat = await SpeakingSessionModel.create({
    moduleId: newModule._id,
  });

  newModule.chatId = newChat._id;
  await newModule.save();

  return { moduleId: newModule._id.toString() };
};





export const generateSpeakingFeedbackHelper = async (
  input: FeedbackInput
): Promise<{ feedback: any; moduleId: string}> => {
  const { moduleId, language } = input;

  if (!moduleId) {
    throw new Error('Missing moduleId');
  }

  const module = await ModuleModel.findById(moduleId);
  if (!module || module.type !== 'speaking') {
    throw new Error('Speaking module not found.');
  }
  console.log("module:", module);

  const chat = await SpeakingSessionModel.findOne({ moduleId }).lean();
  console.log("chat.....", chat);
  if (!chat || !chat.messages || chat.messages.length === 0) {
    throw new Error('No chat history found for this module.');
  }

  // --- Calculate average feedback scores ---
  let totals = { relevance: 0, vocabulary: 0, fluency: 0, pronunciation: 0, structure: 0 };
  let count = 0;

  chat.messages.forEach((msg: any) => {
    if (msg.feedback) {
      totals.relevance += msg.feedback.relevance || 0;
      totals.vocabulary += msg.feedback.vocabulary || 0;
      totals.fluency += msg.feedback.fluency || 0;
      totals.pronunciation += msg.feedback.pronunciation || 0;
      totals.structure += msg.feedback.structure || 0;
      count++;
    }
  });

  const avgScores = Object.fromEntries(
    Object.entries(totals).map(([k, v]) => [k, count ? v / count : 0])
  );

  // --- Build conversation transcript ---
  const conversation = chat.messages
    .map((msg: any) => {
      const userPart = msg.user?.transcription ? `🧑 ${msg.user.transcription}` : '';
      const assistantPart = msg.assistant?.content ? `🤖 ${msg.assistant.content}` : '';
      return [userPart, assistantPart].filter(Boolean).join('\n');
    })
    .join('\n\n');

  const prompt = `
You are a professional ${language} language evaluator.

A student has completed the following speaking task:
"${module.task}"

Below is the complete conversation between the student and the AI assistant:
${conversation}

Evaluate the student's performance qualitatively. 
Do NOT generate numeric scores — they are already calculated separately.

Return feedback in this strict JSON format ONLY:
{
  "Gesamtnote": "4/5 (Gut)",
  "Evaluation": {
    "Pronunciation": "Mostly clear, but watch out for 'r' sounds.",
    "Fluency": "Good, some hesitations when searching for vocabulary.",
    "Grammar": "Generally correct, minor errors in sentence structure.",
    "Response Relevance": "Stayed on topic and answered questions well.",
    "Vocabulary": "Used appropriate vocabulary, but limited range.",
    "Structure": "Sentences were generally well-formed, some errors present."
  },
  "Tips": [
    "Practice common linking phrases to improve flow.",
    "Expand vocabulary related to business and technology.",
    "Focus on intonation to sound more natural."
  ]
}
`.trim();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: 'system',
        content: `You are a structured evaluator of ${language} speaking tasks. Respond only in strict JSON.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const aiResponse = completion.choices[0]?.message?.content?.trim();
  if (!aiResponse) {
    throw new Error('No feedback generated by AI.');
  }

  let feedback;
  try {
    feedback = JSON.parse(aiResponse);
  } catch (err) {
    console.error('Invalid JSON from OpenAI:', aiResponse);
    throw new Error('Invalid JSON returned by AI.');
  }

  // Attach calculated averages to the feedback
  feedback.Scores = avgScores;

  module.aiFeedback = feedback;
  await module.save();

  const messages = chat.messages.map((msg: any) => {
    return {
      user: msg.user?.transcription || null,
      assistant: msg.assistant?.content || null,
      feedback: msg.feedback || null, // optional: attach per-turn feedback
    };
  });

  return {
    moduleId: module._id.toString(),
    feedback:{...feedback,messages}
    
  };
};
