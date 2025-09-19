import { Request, Response } from 'express';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import { ModuleModel } from '../../model/module.model';
import { FeedbackInput } from '../builder.controller';
import ErrorHandler from '../../utils/ErrorHandler';
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });


export const generateComprehensionLogic = async (
  req: Request
): Promise<{ moduleId: string }> => {
  const { topic, level, formality, style, length, language, lengthOption = "medium" } = req.body;



  const wordLengthMap: Record<string, number> = {
    short: 100,
    medium: 150,
    long: 200,
  };

  let wordCount: number;
  if (!lengthOption) {
    throw new ErrorHandler('Length option is required', 400);
  }
  if (lengthOption.toLowerCase() === 'custom') {
    if (typeof length !== 'number' || length <= 0) {
      throw new ErrorHandler('Custom length must be a positive number.', 400);
    }
    else if (length < 20 || length > 500) {
      throw new ErrorHandler('Custom length must be a greater than 20 and less than 500.', 400);
    }
    wordCount = length;
  }

  else {
    wordCount = wordLengthMap[lengthOption.toLowerCase()];
    if (!wordCount) {
      throw new ErrorHandler('Invalid length option. Use short, medium, long, or custom.', 400);
    }
  }

  console.log('wordCount:::', wordCount);


  const prompt = `
You are a language education assistant designed to help learners improve their reading comprehension skills.

Your task is to generate a reading comprehension paragraph followed by exactly four related comprehension questions.

Follow these instructions strictly:

1. Topic: The content must be based on the topic: "${topic}". Stay focused on this topic throughout the paragraph and questions.

2. Learner Level: The paragraph must be written at a reading level appropriate for "${level}" language learners. Use vocabulary and sentence structures suitable for this proficiency level only. Avoid words or constructions that would be too advanced for learners at this stage.

3. Tone: Use a "${formality}" tone. If formal, avoid contractions, colloquialisms, or overly casual expressions. If informal, you may use conversational phrases appropriate to the learners’ level.

4. Style: Write in the style of a "${style || 'general article'}", ensuring clarity, structure, and educational value. Avoid narrative or creative writing styles unless explicitly instructed otherwise.

5. Length: The reading paragraph should contain approximately ${wordCount} words. Ensure the content is informative, clearly structured, and sufficiently detailed without exceeding the word limit by more than ±10%.

6. Language: All output — including the paragraph and the questions — must be written entirely in "${language}". Do not use any words or phrases from other languages.

7. Comprehension Questions:
   - Generate exactly 4 comprehension questions.
   - Write the questions in the same language ("${language}").
   - Each question should test a different aspect of understanding, including:
     - Main idea or central message
     - Specific factual detail from the text
     - Inference or implied meaning
     - Vocabulary or contextual interpretation
   - The questions must be clearly tied to the content of the paragraph.
   - Do not generate answers.

8. Output Format:
   Return the output strictly as a valid JSON object, matching **exactly** this structure (note: use real data, do not include placeholders):

   {
     "comprehension": "Your generated paragraph here...",
     "questions": [
       "Question 1 in ${language}",
       "Question 2 in ${language}",
       "Question 3 in ${language}",
       "Question 4 in ${language}"
     ]
   }

9. Formatting Rules:
   - Do not include any explanations, notes, titles, or labels outside the JSON structure.
   - Do not use Markdown formatting, code blocks, or any surrounding commentary.
   - Output must be raw JSON — ready to be parsed by code.

10. Consistency:
   - Ensure vocabulary, tone, and sentence structure are consistent with the learner level.
   - The paragraph must logically support all four comprehension questions.
   - Avoid synonyms or alternate phrasings not used in the paragraph.

Begin now. Return only a valid JSON object with no surrounding text.
`;

  const prompt2 = `
You are an educational content creator with extensive experience in developing materials that enhance language learning and comprehension skills for diverse learners. Your expertise lies in creating structured texts and relevant questions that support reading development in a clear and engaging manner. 

Your task is to generate a reading comprehension paragraph based on the topic: "${topic}". The content should be tailored for language learners at the level of "${level}". 

The paragraph must maintain a "${formality}" tone, using either formal or informal language as specified. Additionally, write in the style of a “_________”, ensuring clarity and educational value throughout. The text should be strictly ${wordCount} words long, with a permissible range of +-2%.

The output must be entirely in ${language}, with no other languages included. Following the paragraph, generate exactly four comprehension questions, each focusing on a different aspect of understanding the text, including the main idea, specific details, inference, and vocabulary context. Each question must be clearly related to the content of the paragraph.

Return the output strictly as a valid JSON object with the following structure:

{
  "comprehension": "Your generated paragraph here...",
  "questions": [
    "Question 1 in  ${language}",
    "Question 2 in  ${language}",
    "Question 3 in ${language}",
    "Question 4 in ${language}"
  ]
}

Ensure that the vocabulary, tone, and sentence structure are consistent with the learner level. The paragraph must logically support all four comprehension questions, and synonyms or alternate phrasings not used in the paragraph should be avoided.

Do not include any explanations, notes, titles, or labels outside the JSON structure. Output must be raw JSON, ready to be parsed by code.`

  let content = '';
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that generates reading comprehension material for language learners.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      // temperature: 0.8,

    });

    content = completion.choices[0]?.message?.content || '';

    if (!content) {
      throw new ErrorHandler('OpenAI returned an empty response.', 502);
    }
  } catch (err) {
    console.error('OpenAI error:', err);
    throw new ErrorHandler('Failed to generate reading material from OpenAI.', 502);
  }

  let comprehension = '';
  let questions: string[] = [];

  try {
    const parsed = JSON.parse(content);
    comprehension = parsed.comprehension;
    questions = Array.isArray(parsed.questions) ? parsed.questions : [];

    if (!comprehension || questions.length !== 4) {
      throw new Error();
    }
  } catch (err) {
    console.error('Invalid JSON from OpenAI:', content);
    throw new ErrorHandler('Invalid response format from OpenAI.', 500);
  }

  try {
    const newModule = await ModuleModel.create({
      type: 'reading',
      comprehension,
      questions,
    });

    return { moduleId: newModule._id.toString() };
  } catch (err) {
    console.error('Database error while creating reading module:', err);
    throw new ErrorHandler('Failed to save generated module.', 500);
  }
};













interface ReadingFeedbackResult {
  feedback: any;
  moduleId: string;
}

export const generateReadingFeedbackHelper = async (
  input: FeedbackInput
): Promise<ReadingFeedbackResult> => {
  const { moduleId, answers } = input;

  if (!moduleId || !Array.isArray(answers)) {
    throw new ErrorHandler('moduleId and answers[] are required.', 400);
  }

  const module = await ModuleModel.findById(moduleId);
  if (!module) {
    throw new ErrorHandler('Module not found.', 404);
  }

  const { comprehension, questions } = module;

  if (!comprehension || !Array.isArray(questions)) {
    throw new ErrorHandler('Module does not contain comprehension and questions.', 400);
  }

  if (questions.length !== answers.length) {
    throw new ErrorHandler('questions and answers arrays must be of equal length.', 400);
  }

  const feedbackPrompt = `
Du bist ein Deutschlehrer. Analysiere die Antworten eines Schülers zu einem Leseverständnis.

Hier ist der Lesetext:
"${comprehension}"

Fragen und Antworten:
${questions.map((q, i) => `Frage ${i + 1}: ${q}\nAntwort des Schülers: ${answers[i]}`).join('\n\n')}

Gib bitte für jede Frage eine detaillierte Rückmeldung im folgenden JSON-Format:

[
  {
    "frage": "Frage 1...",
    "Deine Antwort:": "Antwort...",
    "status": "Korrekt" oder "Inkorrekt",
    "Vorschlag: Consider this:": "Alternative oder verbesserte Antwort"
  }
]

Nur JSON antworten, auf Deutsch. Keine Erklärungen.
`.trim();

  let content = '';
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5",
      // temperature: 0.7,
      messages: [
        { role: 'system', content: 'Du bist ein hilfsbereiter Deutschlehrer.' },
        { role: 'user', content: feedbackPrompt },
      ],
    });

    content = completion.choices[0]?.message?.content?.trim() || '';
    if (!content) {
      throw new ErrorHandler('No feedback generated by AI.', 502);
    }
  } catch (err) {
    console.error('OpenAI generation failed:', err);
    throw new ErrorHandler('Failed to generate feedback from AI.', 502);
  }

  let feedback;
  try {
    feedback = JSON.parse(content);
  } catch (err) {
    console.error('OpenAI returned invalid JSON:', content);
    throw new ErrorHandler('Failed to parse OpenAI response.', 500);
  }

  try {
    module.answers = answers;
    module.aiFeedback = feedback;
    await module.save();
  } catch (err) {
    console.error('Failed to save feedback to DB:', err);
    throw new ErrorHandler('Error saving feedback to database.', 500);
  }

  return {
    feedback,
    moduleId: module._id.toString(),
  };
};