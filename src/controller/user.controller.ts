import { NextFunction, Request, Response } from "express";
import { findUserByEmail, findUserById, findUserBySocialId, userData } from "../service/user.service";
import User from "../model/user.model";
import { comparePassword, generateOTP, generateRandomString, hashPassword, signToken, SUCCESS } from "../utils/helper";
import { sendEmail } from "../utils/sendEmail";
import ErrorHandler from "../utils/ErrorHandler";
import subscriptionModel from "../model/subscription.model";

const socialLogin = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { socialId, provider, email, deviceToken, deviceType } = req.body;
        let user = await findUserBySocialId(socialId, provider);
        const lowercaseEmail = email?.toLowerCase();
        if (!user) {
            user = await findUserByEmail(lowercaseEmail);


            if (user) {
                user.socialLinkedAccounts.push({ provider, id: socialId });
            } else {
                user = new User({
                    email: lowercaseEmail,
                    socialLinkedAccounts: [{ provider, id: socialId }],
                    deviceToken,
                    deviceType,
                });
            }

        }
        user.deviceToken = deviceToken ?? null;
        user.deviceType = deviceType ?? null;
        const jti = generateRandomString(10);
        user.jti = jti;

        await user.save();

        const token = signToken({ id: user._id, jti });
        SUCCESS(res, 200, "User login successfully", {
            user: userData(user),
            token,
        });
    } catch (error) {
        console.log("error in socialLogin", error);
        next(error);
    }
}

export const register = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { email, password, deviceToken, deviceType } = req.body;
        const lowercaseEmail = email?.toLowerCase();
        const existingUser = await findUserByEmail(lowercaseEmail);
        if (existingUser) {
            return next(new ErrorHandler("User already exists with this email", 400));
        }

        const hashedPassword = await hashPassword(password);
        // const jti = generateRandomString(10);

        const newUser = new User({
            email: lowercaseEmail,
            password: hashedPassword,
            deviceToken,
            deviceType,
            // jti
        });

        await newUser.save();

        // const token = signToken({ id: newUser._id, jti });

        SUCCESS(res, 201, "User registered successfully", {
            user: userData(newUser),
            // token
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { email, password, deviceToken, deviceType } = req.body;
        const lowercaseEmail = email?.toLowerCase();
        const user = await findUserByEmail(lowercaseEmail);
        if (!user) {
            return next(new ErrorHandler("Invalid credentials. Please try again.", 401));
        }

        const isMatch = await comparePassword(password, user.password);

        if (!isMatch) {
            return next(new ErrorHandler("Invalid credentials. Please try again.", 401));
        }


        const jti = generateRandomString(10);
        user.jti = jti;
        user.deviceToken = deviceToken ?? null;
        user.deviceType = deviceType ?? null;
        await user.save();

        const token = signToken({ id: user._id, jti });

        SUCCESS(res, 200, "User login successful", {
            user: userData(user),
            token
        });
    } catch (error) {
        next(error);
    }
};


export const forgetPassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { email } = req.body;
        const lowercaseEmail = email?.toLowerCase();
        const user = await findUserByEmail(lowercaseEmail);
        if (!user) {
            return next(new ErrorHandler("Invalid email", 401));
        }
        const otp = generateOTP();
        user.otp = Number(otp);
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        user.otpVerified = false;
        await user.save();

        await sendEmail(lowercaseEmail, 3, otp);

        return SUCCESS(res, 200, "A one-time password (OTP) has been sent to your email to reset your password.", {
            user: userData(user)
        });


    } catch (error) {
        next(error);
    }
}


const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { email, otp } = req.body;
        const lowercaseEmail = email?.toLowerCase();
        const user = await findUserByEmail(lowercaseEmail);
        if (!user) {
            return next(new ErrorHandler("Invalid email", 401));
        }

        const currentTime = new Date();

        if (!user.otp || !user.otpExpiry || user.otp !== Number(otp)) {
            return next(new ErrorHandler("Invalid or expired OTP", 400));
        }

        if (currentTime > user.otpExpiry) {
            return next(new ErrorHandler("OTP has expired. Please request a new one.", 400));
        }

        user.otpVerified = true;
        user.otp = null;
        user.otpExpiry = null;
        const jti = generateRandomString(10);
        user.jti = jti;

        await user.save();

        const token = signToken({ id: user._id, jti });

        return SUCCESS(res, 200, "OTP verified successfully.", {
            user: userData(user),
            token
        });

    } catch (error) {
        next(error);
    }
};

const resendOtp = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { email } = req.body;
        const lowercaseEmail = email?.toLowerCase();
        const user = await findUserByEmail(lowercaseEmail);
        if (!user) {
            return next(new ErrorHandler("Invalid email", 401));
        }

        const currentTime = new Date();

        if (user.otpExpiry && currentTime < user.otpExpiry) {
            const remaining = Math.ceil((user.otpExpiry.getTime() - currentTime.getTime()) / 1000);
            return next(new ErrorHandler(`OTP was already sent. Please wait ${remaining} seconds before requesting again.`, 429));
        }

        const otp = generateOTP();
        user.otp = parseInt(otp, 10);
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        user.otpVerified = false;
        await user.save();

        await sendEmail(lowercaseEmail, 3, otp);

        return SUCCESS(res, 200, "A new one-time password (OTP) has been sent to your email.", {
            user: userData(user)
        });

    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { email, password } = req.body;
        const lowercaseEmail = email?.toLowerCase();
        const user = await findUserByEmail(lowercaseEmail);
        if (!user) {
            return next(new ErrorHandler("Invalid email", 401));
        }

        if (!user.otpVerified) {
            return next(new ErrorHandler("OTP verification is required to reset the password.", 403));
        }

        const isSame = await comparePassword(password, user.password);
        if (isSame) {
            return next(new ErrorHandler("New password must be different from the current password.", 400));
        }

        user.password = await hashPassword(password);
        user.otpVerified = false;
        await user.save();

        return SUCCESS(res, 200, "Password has been reset successfully.", {
            user: userData(user)
        });

    } catch (error) {
        next(error);
    }
};




export const getUser = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return next(new ErrorHandler("Unauthorized. User ID not found.", 401));
        }

        const user = await findUserById(userId);

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }
        const subscription = await subscriptionModel.find({ stripeSubscriptionId: user.subscriptionId }).lean()
        console.log(user.subscriptionId)
        return SUCCESS(res, 200, "User details fetched successfully", {
            user: userData(user), subscription
        });
    } catch (error) {
        next(error);
    }
};



export const updateUserProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<any> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return next(new ErrorHandler("Unauthorized. User ID not found.", 401));
        }

        const { name, bio , preferredLanguage } = req.body;

        if (!name && !bio && !preferredLanguage) {
            return next(new ErrorHandler("Nothing to update", 400));
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                ...(name !== undefined && { name }),
                ...(bio !== undefined && { bio }),
                ...(preferredLanguage !== undefined && { preferredLanguage })
            },
            { new: true } // return the updated user
        ).lean();

        if (!updatedUser) {
            return next(new ErrorHandler("User not found", 404));
        }

        return SUCCESS(res, 200, "Profile updated successfully", {
            user: {
                _id: updatedUser._id,
                email: updatedUser.email,
                name: updatedUser.name,
                bio: updatedUser.bio,
                preferredLanguage:updatedUser?.preferredLanguage
            },
        });
    } catch (error) {
        next(error);
    }
};


export const getPreferredLanguage = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<any> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return next(new ErrorHandler("Unauthorized. User ID not found.", 401));
        }

        const user = await User.findById(userId).select("preferredLanguage").lean();
        console.log(user)

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        return SUCCESS(res, 200, "Preferred language fetched successfully.", {
            preferredLanguage: user.preferredLanguage || "en",
        });
    } catch (error) {
        next(error);
    }
};


export const setPreferredLanguage = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<any> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return next(new ErrorHandler("Unauthorized. User ID not found.", 401));
        }

        const { language } = req.body;

        if (!language) {
            return next(new ErrorHandler("Preferred language is required.", 400));
        }

        const allowedLanguages = ["English", "German", "fr", "es"];
        if (!allowedLanguages.includes(language)) {
            return next(
                new ErrorHandler("Invalid language. Allowed: " + allowedLanguages.join(", "), 400)
            );
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { preferredLanguage:language },
            { new: true }
        ).lean();

        if (!updatedUser) {
            return next(new ErrorHandler("User not found", 404));
        }

        return SUCCESS(res, 200, "Preferred language updated successfully.", {
            preferredLanguage: updatedUser.preferredLanguage,
        });
    } catch (error) {
        next(error);
    }
};





export default {
    socialLogin,
    register,
    login,
    forgetPassword,
    verifyOtp,
    resetPassword,
    resendOtp,
    getUser,
    updateUserProfile
}