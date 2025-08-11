import express from "express";
import userController from "../controller/user.controller";
import validate from "../middleware/validate.middleware";
import userSchema from "../schema/user.schema";
import { authenticationMiddleware } from "../middleware/auth.middleware";
const userRouter = express.Router();


userRouter.post("/register",validate(userSchema.registerSchema),userController.register);
userRouter.post("/login",validate(userSchema.loginSchema),userController.login);
userRouter.post("/social-login",validate(userSchema.socialLoginSchema),userController.socialLogin);
userRouter.post("/forgot-password",validate(userSchema.forgetPasswordSchema),userController.forgetPassword);
userRouter.post("/resend-otp",validate(userSchema.resendOtpSchema),userController.resendOtp);
userRouter.post("/verify-otp",validate(userSchema.verifyOtpSchema),userController.verifyOtp);
userRouter.post("/reset-password",validate(userSchema.resetPasswordSchema),authenticationMiddleware,userController.resetPassword);
userRouter.get("/get-user",authenticationMiddleware,userController.getUser)

export default userRouter;
