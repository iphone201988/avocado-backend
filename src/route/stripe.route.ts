import express from "express";
import { authenticationMiddleware } from "../middleware/auth.middleware";
import validate from "../middleware/validate.middleware";
import { cancelSubscription, stripeController } from "../controller/stripe.controller";
const stripeRouter = express.Router();

stripeRouter.post("/create-checkout-session",authenticationMiddleware,stripeController);
stripeRouter.post("/cancel-subscription",authenticationMiddleware,cancelSubscription);


export default stripeRouter;
