import express from "express";
import userRouter from "./user.route";
import moduleRouter from "./modules.route";
import contactUsRouter from "./contactUs.route"
import subscriptionRouter from "./communitySubscription.route"
import questionaireRouter from "./questionaire.route"
const router = express.Router();

router.use('/contact-us',contactUsRouter)
router.use("/auth/user",userRouter)
router.use("/modules",moduleRouter)
router.use("/community",subscriptionRouter)
router.use("/questionnaire",questionaireRouter)

export default router;

