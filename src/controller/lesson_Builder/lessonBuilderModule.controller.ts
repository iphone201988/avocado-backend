// import { Request, Response } from 'express';
// import { OpenAI } from 'openai';
// import dotenv from 'dotenv';
// import { generateComprehension } from '../skill_Builder/readingModule.controller';
// import { generateAudio } from '../skill_Builder/listeningModule.controller';
// import { getWritingTask } from '../skill_Builder/writingModule.controller';
// import { getSpeakingTask } from '../skill_Builder/speakingModule.controller';
// dotenv.config();

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });




// export const generateFullLesson = async (req: Request, res: Response):promis => {
//     try {
//       const { topic, level, formality, style, writingType } = req.body;
  
//       if (!topic || !level || !formality) {
//         return res.status(400).json({ error: 'Missing required fields: topic, level, formality.' });
//       }
  
//       // Fire all tasks in parallel
//       const [reading, listening, writing, speaking] = await Promise.all([
//         generateComprehension({
//           body: { topic, level, formality, style },
//         } as any, dummyResponse()),
//         generateAudio({
//           body: { topic, level, formality, style },
//         } as any, dummyResponse()),
//         getWritingTask({
//           body: { topic, level, formality, writingType },
//         } as any, dummyResponse()),
//         getSpeakingTask({
//           body: { topic, level, formality, style },
//         } as any, dummyResponse()),
//       ]);
  
//       const lesson = {
//         topic,
//         level,
//         formality,
//         style,
//         writingType,
//         reading: reading?.jsonData || reading,
//         listening: listening?.jsonData || listening,
//         writing: writing?.jsonData || writing,
//         speaking: speaking?.jsonData || speaking,
//       };
  
//       return res.json({ lesson });
//     } catch (err) {
//       console.error('Error generating full lesson:', err);
//       return res.status(500).json({ error: 'Failed to generate full lesson.' });
//     }
//   };
  
//   const dummyResponse = () => {
//     return {
//       json: function (data: any) {
//         (this as any).jsonData = data;
//         return data;
//       },
//       status: function () {
//         return this;
//       },
//     } as unknown as Response;
//   };