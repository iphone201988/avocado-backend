import express from "express";
import { authenticationMiddleware } from "../middleware/auth.middleware";
import { contactUs } from "../controller/contactUs.controller";
import validate from "../middleware/validate.middleware";
import { contactUsSchema } from "../schema/user.schema";
const moduleRouter = express.Router();

moduleRouter.post("/",validate(contactUsSchema),contactUs);

export default moduleRouter;
