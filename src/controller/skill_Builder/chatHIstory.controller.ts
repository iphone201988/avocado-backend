import OpenAI from 'openai';
import { Request, Response } from 'express';
import { ModuleModel } from '../../model/module.model';
import { SpeakingChatModel } from '../../model/chatHIstory.model';
import ErrorHandler from '../../utils/ErrorHandler';
import { ScoredLessonModel } from '../../model/lesson.model';
import { Completions } from 'openai/resources';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import mongoose from 'mongoose';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const chatWithSpeakingModule = async (req: Request, res: Response): Promise<any> => {
  try {
    const { moduleId } = req.params;
    const { message, language } = req.body;
    const userId = req.userId;

    if (!message || !moduleId || !userId || !language) {
      throw new ErrorHandler('Missing message, moduleId, language, or userId', 400);
    }

    const module = await ModuleModel.findById(moduleId);
    if (!module || module.type !== 'speaking') {
      throw new ErrorHandler('Speaking module not found', 404);
    }

    let chat = await SpeakingChatModel.findOne({ moduleId, userId });
    if (!chat) {
      chat = await SpeakingChatModel.create({
        moduleId,
        userId,
        messages: [{ role: 'assistant', content: module.task }],
      });
    }

    chat.messages.push({ role: 'user', content: message });

    const builder = await ScoredLessonModel.findOne({ "modules.module": module._id });
    if (!builder) {
      throw new ErrorHandler('Parent lesson (builder) not found for this module.', 404);
    }

    // --- 🌍 Strong language enforcement ---
    const contextPrompt = `
You are a native-level conversation partner for language learners.
⚠️ Respond strictly in "${language}". Do not use any other language. Do not translate. Do not explain. Only use ${language}.

Context:
- Topic: ${builder.topic}
- Level: ${builder.level}
- Formality: ${builder.formality}
- Task: ${module.task}

Continue the conversation naturally in ${language}. React to the user's last message and ask follow-up questions to keep the conversation going.
`.trim();

    const openAiMessages: ChatCompletionMessageParam[] = [
      { role: 'system', content: contextPrompt },
      ...chat.messages.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-5',
      // temperature: 0.7,
      messages: openAiMessages,
    });

    const aiReply = completion.choices[0]?.message?.content;
    if (!aiReply) throw new ErrorHandler('AI did not respond.', 500);

    chat.messages.push({ role: 'assistant', content: aiReply });
    await chat.save();

    return res.status(200).json({
      reply: aiReply,
      messages: chat.messages
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    const status = error instanceof ErrorHandler ? error.statusCode : 500;
    return res.status(status).json({ success: false, error: error.message || 'Internal Server Error' });
  }
};




export const getSpeakingChatMessages = async (req: Request, res: Response): Promise<any> => {
  try {
    const { moduleId } = req.params;
    const userId = req.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      throw new ErrorHandler('Invalid moduleId', 400);
    }

    if (!userId) {
      throw new ErrorHandler('Unauthorized access: userId missing', 401);
    }

    const chat = await SpeakingChatModel.findOne({ moduleId, userId }).lean();

    if (!chat || !chat.messages) {
      return res.status(200).json({ messages: [], total: 0, page, totalPages: 0 });
    }

    const total = chat.messages.length;
    const totalPages = Math.ceil(total / limit);

    const startIndex = (page - 1) * limit;
    const paginatedMessages = chat.messages
      .slice()
      .reverse() // optional: reverse to show latest messages first
      .slice(startIndex, startIndex + limit)
      .reverse(); // reverse again to maintain chat order

    return res.status(200).json({
      messages: paginatedMessages,
      total,
      page,
      totalPages,
    });

  } catch (error: any) {
    console.error('Error fetching chat messages:', error);
    const status = error instanceof ErrorHandler ? error.statusCode : 500;
    return res.status(status).json({ success: false, error: error.message || 'Internal Server Error' });
  }
};