import express from "express";
import { generateAndStoreModule, generateFeedback, getAllUserLessons, getBuilderById, getModuleByBuilderAndType, getSpeakingChatByBuilderId, linkUserWithBuilder, unlinkUserWithBuilder } from "../controller/builder.controller";
import { authenticationMiddleware } from "../middleware/auth.middleware";
import { getWordOrSentenceInsights } from "../controller/skill_Builder/listeningModule.controller";
import { chatWithSpeakingModule, getSpeakingChatMessages } from "../controller/skill_Builder/chatHIstory.controller";
import validate from "../middleware/validate.middleware";
import { chatWithSpeakingModuleSchema, generateAndStoreModuleSchema, generateFeedbackSchema, generateFullStoryLessonSchema, getBuilderByIdSchema, getModuleByBuilderAndTypeSchema, getSpeakingChatByBuilderIdSchema, getWordOrSentenceInsightsSchema, linkUserWithBuilderSchema } from "../schema/module.schema";
import { generateFullStoryLesson } from "../controller/story.controller";
const moduleRouter = express.Router();

moduleRouter.post('/story',authenticationMiddleware,validate(generateFullStoryLessonSchema),generateFullStoryLesson)
moduleRouter.get('/chat/:builderId/messages', authenticationMiddleware,validate(getSpeakingChatByBuilderIdSchema), getSpeakingChatByBuilderId);
moduleRouter.post("/feedback/:type",authenticationMiddleware,validate(generateFeedbackSchema),generateFeedback);
moduleRouter.get("/get-module/:builderId",authenticationMiddleware,validate(getBuilderByIdSchema),getBuilderById )
moduleRouter.get("/word-meaning",authenticationMiddleware,validate(getWordOrSentenceInsightsSchema),getWordOrSentenceInsights)
moduleRouter.post("/save/module",authenticationMiddleware,validate(linkUserWithBuilderSchema),linkUserWithBuilder)
moduleRouter.post("/unsave/module",authenticationMiddleware,validate(linkUserWithBuilderSchema),unlinkUserWithBuilder)
moduleRouter.get("/get-lessons",authenticationMiddleware,getAllUserLessons)
moduleRouter.post("/:type",authenticationMiddleware,validate(generateAndStoreModuleSchema),generateAndStoreModule);
moduleRouter.get("/:builderId/:type",authenticationMiddleware,validate(getModuleByBuilderAndTypeSchema),getModuleByBuilderAndType)
moduleRouter.post("/chat/:moduleId",authenticationMiddleware,validate(chatWithSpeakingModuleSchema),chatWithSpeakingModule)

export default moduleRouter;

