import express from "express";
import { getAllSubscribers, subscribeToNewsletter, unsubscribeFromNewsletter } from "../controller/communitySubscription.controller";
import { authenticationMiddleware } from "../middleware/auth.middleware";
import validate from "../middleware/validate.middleware";
import { subscribeSchema } from "../schema/user.schema";
const Router = express.Router();

Router.post("/subscribe",validate(subscribeSchema),subscribeToNewsletter)
Router.post("/unsubscribe",validate(subscribeSchema),unsubscribeFromNewsletter)
Router.get("/user",authenticationMiddleware,getAllSubscribers)
export default Router;

