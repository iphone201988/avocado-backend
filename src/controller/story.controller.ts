import { Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { ScoredLessonModel } from "../model/lesson.model";
import { ModuleModel } from "../model/module.model";
import mongoose from "mongoose";
import { generatorMap, SUPPORTED_TYPES } from "./builder.controller";
import { ModuleKind } from "../schema/lesson.schema";
import { SocialLoginType } from "../utils/enums";
import { hasActiveSubscription } from "../middleware/checkSubscription.middleware";


export const generateFullStoryLesson = async (req: Request, res: Response): Promise<any> => {
    try {
        const { title, level, genre,language="german" } = req.body;
        const userId = req.userId;

        if (!level || !genre) {
            throw new ErrorHandler("Missing required fields: language level or genre", 400);
        }

        const topic = title?.trim() || `${genre} Story`; // fallback if no title provided
        const formality = "neutral"; // or allow user input if needed
        const writingType = "narrative"; // default or let frontend decide

        // Create empty Scored Lesson
        const scoredLesson = await ScoredLessonModel.create({
            topic,
            level,
            formality,
            writingType,
            type: "lessonBuilder",
            userId,
            modules: [],
        });

        const generationTasks = SUPPORTED_TYPES.map(async (modType) => {
            const generatorFn = generatorMap[modType];
            if (!generatorFn) return null;
            const fakeReq = {
                ...req,
                body: {
                    ...req.body,
                    language:"German",
                    topic: scoredLesson.topic,
                    level: scoredLesson.level,
                    formality: scoredLesson.formality,
                    writingType, // optional if needed for writing module
                },
                params: { type: modType },
                user: req.user,
                userId: req.userId,
            } as unknown as Request;


            try {
                const { moduleId } = await generatorFn(fakeReq);
                const moduleData = await ModuleModel.findById(moduleId);
                return moduleData
                    ? { modType, moduleId, moduleData }
                    : null;
            } catch (err) {
                console.error(`Error generating module "${modType}":`, err);
                return null;
            }
        });

        const results = await Promise.all(generationTasks);
        let subscriptionRequired = false
            const subs = await hasActiveSubscription(userId);
            console.log(subs);
            if (!subs.valid) {
              subscriptionRequired = true
            }
        const generatedModules = results
            .filter((r): r is { modType: ModuleKind; moduleId: string; moduleData: any } => !!r && !!r.moduleData)
            .map(({ modType, moduleId, moduleData }) => {
                scoredLesson.modules.push({
                    type: modType,
                    module: new mongoose.Types.ObjectId(moduleId),
                });
                if (!subs.valid && (modType == "listening" || modType == "speaking")) {
                    return {type:modType, module:{subscriptionRequired:true,_id:moduleId}}
        // generatedModules[modType] = { subscriptionRequired: true, _id: moduleData._id, type: modType }
      }
                else{
                    return {
                    type: modType as ModuleKind,
                    module: moduleData,
                };
                }
            });

        if (generatedModules.length === 0) {
            throw new ErrorHandler("Failed to generate any modules.", 500);
        }

        await scoredLesson.save();

        return res.status(200).json({
            success: true,
            data: {
                scoredLessonId: scoredLesson._id,
                topic,
                modules: generatedModules,
            }
        });

    } catch (error: any) {
        console.error("Error generating story lesson:", error);
        const status = error instanceof ErrorHandler ? error.statusCode : 500;
        return res.status(status).json({ error: error.message || "Internal Server Error" });
    }
};