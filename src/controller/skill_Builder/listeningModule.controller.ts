import { Request, Response } from 'express';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import { ModuleModel } from '../../model/module.model';
import { FeedbackInput } from '../builder.controller';
import ErrorHandler from '../../utils/ErrorHandler';
import { hasActiveSubscription } from '../../middleware/checkSubscription.middleware';
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });


export const generateAudio = async (req: Request): Promise<{ moduleId: string }> => {

  // const userId = req.userId;
  //   const subs=await hasActiveSubscription(userId);
  //   console.log(subs);
  //   if(!subs.valid){
  //       try {
  //   const newModule = await ModuleModel.create({
  //     type: 'listening',
  //     subscriptionRequired:true
  //   });
    


  //   return { moduleId: newModule._id.toString() };
  // } catch (err) {
  //   console.error('Error saving module to DB:', err);
  //   throw new ErrorHandler('Failed to save generated module to the database.', 500);
  // }
  //   }
  

  const { topic, level, formality, style = 'defaultStyle', language = 'german' } = req.body;

  if (!topic || !level || !formality || !language) {
    throw new ErrorHandler('Missing required fields: topic, level, formality, or language.', 400);
  }

  const prompt = `
You are a helpful assistant that creates listening-focused content for language learners.

Your task:
- Generate a **spoken-style paragraph** of at least 100 words on the topic: "${topic}"
- It should be suitable for a learner at "${level}" level
- Use a "${formality}" tone and style: ${style || 'casual spoken monologue'}
- The language of the **entire response must be strictly in ${language}** — do not switch languages, do not explain or translate.
- The paragraph should sound natural, as if spoken aloud in ${language}

Then, generate 4 **comprehension questions** based on the paragraph, also written in ${language}.

Respond **strictly** in this JSON format:

{
  "comprehension": "....",
  "questions": [
    "Question 1...",
    "Question 2...",
    "Question 3...",
    "Question 4..."
  ]
}
`.trim();

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: 'system',
          content: `You are a language assistant who generates listening content and comprehension questions in ${language}. Only use ${language} — do not switch or explain.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      // temperature: 0.8,
    });
  } catch (err) {
    throw new ErrorHandler('Failed to generate content from OpenAI.', 502);
  }

  const content = completion.choices[0]?.message?.content || '';

  let data;
  try {
    data = JSON.parse(content);
  } catch (err) {
    console.error('OpenAI response was not valid JSON:', content);
    throw new ErrorHandler('Failed to parse OpenAI response.', 500);
  }
   
     
  try {
    const newModule = await ModuleModel.create({
      type: 'listening',
      questions: data.questions,
      answers: [],
      comprehension: data.comprehension,
      aiFeedback: null,
    });
    


    return { moduleId: newModule._id.toString() };
  } catch (err) {
    console.error('Error saving module to DB:', err);
    throw new ErrorHandler('Failed to save generated module to the database.', 500);
  }
};









export const generateListeningFeedbackHelper = async (
  input: FeedbackInput
): Promise<{ feedback: any; moduleId: string }> => {
  const { moduleId, answers, language } = input;

  if (!moduleId || !Array.isArray(answers) || !language) {
    throw new ErrorHandler('moduleId, answers[], and language are required.', 400);
  }

  const module = await ModuleModel.findById(moduleId);
  if (!module) {
    throw new ErrorHandler('Module not found.', 404);
  }

  const paragraph = module.comprehension;
  const questions = module.questions;

  if (!paragraph || !Array.isArray(questions) || questions.length !== answers.length) {
    throw new ErrorHandler(
      'Module must contain a comprehension and matching questions[].',
      400
    );
  }

  // Build feedback prompt strictly in requested language
  const feedbackPrompt = `
You are a helpful language teacher. Analyze a student's answers to a listening comprehension task.
Respond strictly in "${language}" and return only valid JSON in the format below.

Comprehension passage:
"${paragraph}"

Questions and student answers:
${questions
  .map((q, i) => `Question ${i + 1}: ${q}\nStudent answer: ${answers[i]}`)
  .join('\n\n')}

Now give detailed feedback for each answer in the following JSON format only:

[
  {
    "frage": "Frage 1...",
    "Deine Antwort:": "Antwort des Schülers...",
    "status": "Korrekt" oder "Inkorrekt",
    "Vorschlag: Consider this:": "Alternative oder verbesserte Antwort"
  }
]

⚠️ Rules:
- Respond ONLY in ${language}
- Do not explain or translate anything
- Do not output anything except valid JSON
`.trim();

  let content = '';
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      // temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: `You are a language teacher assistant. Respond strictly in ${language}.`,
        },
        {
          role: 'user',
          content: feedbackPrompt,
        },
      ],
    });

    content = completion.choices[0]?.message?.content?.trim() || '';
    if (!content) {
      throw new ErrorHandler('No feedback generated by AI.', 500);
    }
  } catch (err) {
    console.error('OpenAI error:', err);
    throw new ErrorHandler('Failed to generate feedback from OpenAI.', 502);
  }

  let feedback;
  try {
    feedback = JSON.parse(content);
  } catch (err) {
    console.error('Invalid JSON from OpenAI:', content);
    throw new ErrorHandler('Failed to parse OpenAI feedback.', 500);
  }

  try {
    module.answers = answers;
    module.aiFeedback = feedback;
    await module.save();
  } catch (err) {
    console.error('Error saving feedback to module:', err);
    throw new ErrorHandler('Failed to save feedback to database.', 500);
  }

  return {
    feedback,
    moduleId: module._id.toString(),
  };
};






export const getWordOrSentenceInsights = async (req: Request, res: Response): Promise<any> => {
  try {
    const { text} = req.query 

    if (!text || typeof text !== 'string') {
      throw new ErrorHandler('"text" is required as a query parameter.', 400);
    }

    const prompt = `
You are a multilingual language assistant specialized in analyzing and explaining words and concepts in the german language.

Given the following input in english: "${text}"

Perform the following steps:
1. If the input is a **single word**, treat it as the main keyword.
2. If the input is a **full sentence**, then translate that sentence.

Return ONLY a well-formatted JSON object with the following fields:

{
  "noun": "<Extracted keyword or input word>",
  "meaning": "<Concise English definition of the word>",
  "example": "<german sentence using the word in natural context (may reuse the input if appropriate)>",
  "translation": "<English translation of the "${text}"",
  "synonyms": "<Comma-separated list of 2 to 4 german synonyms>"
}

Do not include any explanations, markdown, or additional commentary. Output a raw JSON object only.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      // temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that explains ${language} words and sentences.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) throw new ErrorHandler('No content returned by OpenAI.', 502);

    let result;
    try {
      result = JSON.parse(content);
      return res.status(200).json(result);
    } catch (err) {
      console.warn('OpenAI returned non-JSON output. Returning raw content.');
      return res.status(200).json({
        raw: content,
        warning: 'The response was not valid JSON. Returning raw text instead.',
      });
    }

  } catch (error: any) {
    const status = error instanceof ErrorHandler ? error.statusCode : 500;
    return res.status(status).json({ error: error.message || 'Internal Server Error' });
  }
};