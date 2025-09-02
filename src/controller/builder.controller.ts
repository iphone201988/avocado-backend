import { Request, Response } from 'express';
import { generateComprehensionLogic, generateReadingFeedbackHelper } from './skill_Builder/readingModule.controller';
import { generateAudio, generateListeningFeedbackHelper } from './skill_Builder/listeningModule.controller';
import { generateWritingFeedbackHelper, getWritingTaskLogic } from './skill_Builder/writingModule.controller';
import { ScoredLessonModel } from '../model/lesson.model';
import { ModuleModel } from '../model/module.model';
import { ModuleKind } from '../schema/lesson.schema';
import mongoose, { Types } from 'mongoose';
import { generateSpeakingFeedbackHelper, getSpeakingTaskLogic } from './skill_Builder/speakingModule.controller';
import User from '../model/user.model';
import { IUser } from '../../types/Database/types';
import ErrorHandler from '../utils/ErrorHandler';
import { SUCCESS } from '../utils/helper';
import { hasActiveSubscription } from '../middleware/checkSubscription.middleware';
import { SpeakingSessionModel } from '../model/speakingSession.model';


export const SUPPORTED_TYPES: ModuleKind[] = ['reading', 'listening', 'writing', 'speaking'];

export const generatorMap: Record<ModuleKind, (req: Request) => Promise<{ moduleId: string }>> = {
  reading: generateComprehensionLogic,
  listening: generateAudio,
  writing: getWritingTaskLogic,
  speaking: getSpeakingTaskLogic,
};

export const generateAndStoreModule = async (req: Request, res: Response): Promise<any> => {
  try {
    const type = req.params.type; // 'lessonBuilder' OR one of: reading, listening, writing, speaking
    const {
      topic,
      level,
      formality,
      writingType,
      style = 'defaultStyle',
      language = 'german',
      lengthOption,
      length,
    } = req.body;

    const userId = req.userId;

    const typesToGenerate: ModuleKind[] =
      type === 'lessonBuilder'
        ? SUPPORTED_TYPES
        : SUPPORTED_TYPES.includes(type as ModuleKind)
          ? [type as ModuleKind]
          : [];

    if (typesToGenerate.length === 0) {
      throw new ErrorHandler('Invalid module type', 400);
    }

    // Step 1: Create empty scored lesson
    const scoredLesson = await ScoredLessonModel.create({
      topic,
      level,
      formality,
      writingType,
      style,
      type,
      userId,
      modules: [],
    });

    // Step 2: Generate modules (no try/catch here — let it fail if needed)
    let subscriptionRequired = false
    const subs = await hasActiveSubscription(userId);
    console.log(subs);
    if (!subs.valid) {
      subscriptionRequired = true
    }
    const generationTasks = typesToGenerate.map(async (modType) => {

      const generatorFn = generatorMap[modType];
      if (!generatorFn) {
        throw new ErrorHandler(`No generator found for module type: ${modType}`, 500);
      }

      const fakeReq = {
        ...req,
        params: { ...req.params, type: modType },
        user: req.user,
        userId: req.userId,
        body: {
          topic,
          level,
          formality,
          style,
          language,
          lengthOption,
          length,
          writingType,
        },
      } as unknown as Request;

      const { moduleId } = await generatorFn(fakeReq);
      const moduleData = await ModuleModel.findById(moduleId);

      if (!moduleData) {
        throw new ErrorHandler(`Module not found for type: ${modType}`, 500);
      }


      return { modType, moduleId, moduleData };
    });

    const results = await Promise.all(generationTasks);

    // Step 3: Filter and collect results
    const generatedModules: Partial<Record<ModuleKind, any>> = {};

    results.forEach(({ modType, moduleId, moduleData }) => {
      scoredLesson.modules.push({
        type: modType,
        module: new mongoose.Types.ObjectId(moduleId),
      });

      if (!subs.valid && (modType == "listening" || modType == "speaking")) {
        generatedModules[modType] = { subscriptionRequired: true, _id: moduleData._id, type: modType }
      }
      else {
        generatedModules[modType] = moduleData;
      }
    });

    await scoredLesson.save();

    return res.status(200).json({
      success: true,
      data: {
        scoredLessonId: scoredLesson._id,
        modules: generatedModules,
      },
    });

  } catch (error: any) {
    console.error('Error generating and storing module:', error);
    const status = error instanceof ErrorHandler ? error.statusCode : 500;
    return res.status(status).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
};




export type FeedbackInput = {
  moduleId: string;
  answers?: string[];
  paragraph?: string;
  response?: string;
  language: string;
};

type FeedbackHelper = (input: FeedbackInput) => Promise<{ feedback: any; moduleId: string }>;

const feedBackMap: Record<string, FeedbackHelper> = {
  reading: generateReadingFeedbackHelper,
  listening: generateListeningFeedbackHelper,
  writing: generateWritingFeedbackHelper,
  speaking: generateSpeakingFeedbackHelper,
};



export const generateFeedback = async (req: Request, res: Response): Promise<any> => {
  try {
    const type = req.params.type as 'reading' | 'listening' | 'writing' | 'speaking';
    const { builderId, answers, paragraph, response, language = "german" } = req.body;

    const builder = await ScoredLessonModel.findById(builderId);
    if (!builder) {
      throw new ErrorHandler('Builder not found.', 404);
    }

    const moduleEntry = builder.modules.find((mod) => mod.type === type);
    if (!moduleEntry) {
      throw new ErrorHandler(`No module of type ${type} found in builder.`, 404);
    }

    const moduleId = moduleEntry.module.toString();
    const feedbackFn = feedBackMap[type];

    if (!feedbackFn) {
      throw new ErrorHandler(`No feedback function defined for type ${type}`, 400);
    }

    const input: FeedbackInput = { moduleId, answers, paragraph, response, language };
    const { feedback } = await feedbackFn(input);

    return res.status(200).json({
      success: true, data: {
        moduleId, feedback
      }
    });

  } catch (error: any) {
    console.error('Error generating feedback:', error);
    const status = error instanceof ErrorHandler ? error.statusCode : 500;
    return res.status(status).json({ error: error.message || 'Internal Server Error', success: false });
  }
};




export const getModuleByBuilderAndType = async (req: Request, res: Response): Promise<any> => {
  try {
    const { builderId, type } = req.params;
    let subscriptionRequired = false
    const userId=req.userId
    const subs = await hasActiveSubscription(userId);
    console.log(subs);
    if (!subs.valid) {
      subscriptionRequired = true
    }
   


    const builder = await ScoredLessonModel.findById(builderId);
    if (!builder) {
      throw new ErrorHandler('Builder not found.', 404);
    }

    const moduleEntry = builder.modules.find((mod) => mod.type === type);
    if (!moduleEntry) {
      throw new ErrorHandler(`No module of type "${type}" found in builder.`, 404);
    }

    const module = await ModuleModel.findById(moduleEntry.module);
    if (!module) {
      throw new ErrorHandler('Module not found.', 404);
    }
     if(subscriptionRequired && (type=="listening" || type=="speaking")){
      return res.status(200).json({
      success: true,
      data: {
        title: builder.topic,
        moduleId: module._id,
        type,
        module:{
          subscriptionRequired: true, _id: module._id, type: module.type
        },
      }
    });
    }

    return res.status(200).json({
      success: true,
      data: {
        title: builder.topic,
        moduleId: module._id,
        type,
        module,
      }
    });

  } catch (error: any) {
    console.error('Error fetching module:', error);
    const status = error instanceof ErrorHandler ? error.statusCode : 500;
    return res.status(status).json({ error: error.message || 'Internal Server Error', success: false });
  }
};



declare module 'express-serve-static-core' {
  interface Request {
    userId: string
    user?: IUser;
  }
}


export const unlinkUserWithBuilder = async (req: Request, res: Response): Promise<any> => {
  try {
    const { builderId } = req.body;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(builderId)) {
      throw new ErrorHandler('Invalid builderId', 400);
    }

    if (!userId) {
      throw new ErrorHandler('Unauthorized. User ID missing.', 401);
    }

    const builder = await ScoredLessonModel.findById(builderId);
    if (!builder) {
      throw new ErrorHandler('Builder not found', 404);
    }

    // 1. Remove builderId from user.lessons[]
    await User.findByIdAndUpdate(
      userId,
      {
        $pull: { lessons: { moduleId: builder._id } }
      },
      { new: true }
    );

    // 2. Remove userId from builder if it matches
    if (builder.userId && builder.userId.toString() === userId.toString()) {
      builder.userId = undefined;
      await builder.save();
    }

    return res.status(200).json({
      data: { message: 'User and Builder unlinked successfully' },
      success: true
    });

  } catch (error: any) {
    console.error('Error unlinking user with builder:', error);
    const status = error instanceof ErrorHandler ? error.statusCode : 500;
    return res.status(status).json({
      error: error.message || 'Internal Server Error',
      success: false
    });
  }
};


export const linkUserWithBuilder = async (req: Request, res: Response): Promise<any> => {
  try {
    const { builderId } = req.body;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(builderId)) {
      throw new ErrorHandler('Invalid builderId', 400);
    }

    if (!userId) {
      throw new ErrorHandler('Unauthorized. User ID missing.', 401);
    }

    const builder = await ScoredLessonModel.findById(builderId);
    if (!builder) {
      throw new ErrorHandler('Builder not found', 404);
    }

    // 1. Add builderId to user.lessons[] if not already there
    await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: { lessons: { moduleId: builder._id } } // prevents duplicates
      },
      { new: true }
    );

    // 2. Update builder's userId field if needed
    if (!builder.userId || builder.userId.toString() !== userId.toString()) {
      builder.userId = new mongoose.Types.ObjectId(userId);
      await builder.save();
    }

    return res.status(200).json({ data: { message: 'User and Builder linked successfully' }, success: true });

  } catch (error: any) {
    console.error('Error linking user with builder:', error);
    const status = error instanceof ErrorHandler ? error.statusCode : 500;
    return res.status(status).json({ error: error.message || 'Internal Server Error', success: false });
  }
};






export const getAllUserLessons = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ErrorHandler('Unauthorized or invalid user ID', 401);
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new ErrorHandler('User not found', 404);
    }

    const lessonIds = user.lessons.map((lesson) => lesson.moduleId);
    const lessons = await ScoredLessonModel.find({ _id: { $in: lessonIds } });

    return res.status(200).json({ data: lessons, success: true });

  } catch (error: any) {
    console.error('Error fetching user lessons:', error);
    const status = error instanceof ErrorHandler ? error.statusCode : 500;
    return res.status(status).json({ error: error.message || 'Internal Server Error', success: false });
  }
};






export const getBuilderById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { builderId } = req.params;

    if (!builderId || !mongoose.Types.ObjectId.isValid(builderId)) {
      return res.status(400).json({ error: 'Invalid or missing builderId' });
    }
    console.log("Efefefe")
    const builder = await ScoredLessonModel.findById(builderId);

    if (!builder) {
      return res.status(404).json({ error: 'Builder not found', success: false });
    }

    return res.status(200).json({ data: builder, success: true });

  } catch (error) {
    console.error('Error fetching builder by ID:', error);
    console.log("Efefefe")
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};






export const getSpeakingChatByBuilderId = async (req: Request, res: Response): Promise<any> => {
  try {
    const { builderId } = req.params;
    const userId = req.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const builder = await ScoredLessonModel.findById(builderId).lean();
    if (!builder) {
      throw new ErrorHandler('Builder not found', 404);
    }

    const speakingModuleEntry = builder.modules.find((mod) => mod.type === 'speaking');
    if (!speakingModuleEntry) {
      throw new ErrorHandler('No speaking module found in this builder.', 404);
    }

    const moduleId = speakingModuleEntry.module.toString();

    const chat = await SpeakingSessionModel.findOne({ moduleId, userId }).lean();
    if (!chat || !chat.messages || chat.messages.length === 0) {
      return res.status(200).json({ messages: [], total: 0, page, totalPages: 0 });
    }

    const total = chat.messages.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;

    const paginatedMessages = chat.messages
      .slice()
      .reverse()
      .slice(startIndex, startIndex + limit)
      .reverse();

    return res.status(200).json({
      moduleId,
      chatId: chat._id,
      messages: paginatedMessages,
      total,
      page,
      totalPages,
    });

  } catch (error: any) {
    console.error('Error fetching speaking chat:', error);
    const status = error instanceof ErrorHandler ? error.statusCode : 500;
    return res.status(status).json({ error: error.message || 'Internal Server Error' });
  }
};