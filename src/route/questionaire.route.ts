import express from "express";
import { authenticationMiddleware } from "../middleware/auth.middleware";
import validate from "../middleware/validate.middleware";
import { questionaireSchema } from "../schema/user.schema";
import { contactUs } from "../controller/contactUs.controller";
import { questionaire } from "../controller/questionnaire.controller";
const moduleRouter = express.Router();

moduleRouter.post("/",authenticationMiddleware,validate(questionaireSchema),questionaire);

export default moduleRouter;
