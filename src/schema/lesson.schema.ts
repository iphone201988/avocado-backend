import { Type } from '@aws-sdk/client-s3';
import mongoose, { Document, Types } from 'mongoose';

export type LessonType = 'lessonBuilder' | 'skillBuilder';
export type ModuleKind = 'reading' | 'writing' | 'listening' | 'speaking';

export interface ModuleRef {
  type: ModuleKind;
  module: Types.ObjectId;
}


export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IChatHistory extends Document {
  moduleId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  messages: IChatMessage[];
}

export interface ScoredLessonDocument extends Document {
  topic: string;
  level: string;
  formality: string;
  writingType?: string;
  style:string;
  type: LessonType;
  modules: ModuleRef[];
  userId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
  export type ModuleType = 'reading' | 'listening' | 'writing' | 'speaking';

  // For writing/speaking – object with feedback details
  export interface QuestionFeedback {
    frage: string;
    "Deine Antwort:": string;
    status: 'Korrekt' | 'Inkorrekt';
    "Vorschlag: Consider this:": string;
  }
  
  // For writing/speaking – object with feedback details
  export type SpeakingWritingFeedback = {
    overallScore: string; // e.g., "4/5 (Good)"
    grammar: {
      pronunciation?: string;
      fluency?: string;
      structure?: string;
      relevance?: string;
    };
    tips: string[]; // improvement suggestions
  };
  
  // Union of both
  export type AiFeedback = QuestionFeedback[] | SpeakingWritingFeedback;
  export interface ModuleDocument extends Document {
    type: ModuleType;
    paragraph?: string;
    questions?: string[];     // usually 4 questions
    answers?: string[];       // user answers, if submitted
    task?: string;            // for writing/speaking
    comprehension?: string;   // explanation or notes
    aiFeedback?: AiFeedback;  // union of the two types
    createdAt: Date;
    updatedAt: Date;
    chatId:Types.ObjectId
    subscriptionRequired:boolean
  }