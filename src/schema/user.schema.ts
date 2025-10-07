import Joi from "joi";
import {
  stringValidation,
  emailValidation,
  passwordValidation,
  specificNumberValidation,
  numberValidation
} from "./index";
import { deviceType, SocialLoginType } from "../utils/enums";

export const subscribeSchema = {
  body: Joi.object({
    email: emailValidation(),
  })
};
export const contactUsSchema = {
  body: Joi.object({
    email: emailValidation(),
    firstName: stringValidation("First Name"),
    lastName: stringValidation("Last Name"),
    message: stringValidation("Message", false)

  })
}

const socialLoginSchema = {
  body: Joi.object({
    socialId: stringValidation("Social ID"),
    provider: specificNumberValidation("Provider", SocialLoginType),
    email: stringValidation("email"),
    deviceToken: stringValidation("Device Token", false),
    deviceType: specificNumberValidation("Device Type", deviceType, false)
  })
};

const registerSchema = {
  body: Joi.object({
    email: emailValidation(),
    password: passwordValidation(),
    confirmPassword: passwordValidation(),
    deviceToken: stringValidation("Device Token", false),
    deviceType: specificNumberValidation("Device Type", deviceType, false)
  })
};

const loginSchema = {
  body: Joi.object({
    email: emailValidation(),
    password: passwordValidation(),
    deviceToken: stringValidation("Device Token", false),
    deviceType: specificNumberValidation("Device Type", deviceType, false)
  })
};

const forgetPasswordSchema = {
  body: Joi.object({
    email: emailValidation()
  })
};

const verifyOtpSchema = {
  body: Joi.object({
    email: emailValidation(),
    otp: numberValidation("OTP", true, 1000)
  })
};

const resendOtpSchema = {
  body: Joi.object({
    email: emailValidation()
  })
};

const resetPasswordSchema = {
  body: Joi.object({
    email: emailValidation(),
    password: passwordValidation()
  })
};


export const questionaireSchema = {
  body: Joi.object({
    moduleType: Joi.string()
      .required()
      .valid('Beginner', 'Intermediate', 'Advanced').messages({
        "any.only": "Type must be one of 'Beginner','Intermediate','Advanced'",
        "any.required": "moduleType is required",
        "string.base": "moduleType must be a string."
      }),

    rating: Joi.number()
      .min(0)
      .max(5)
      .required()
      .messages({
        "number.base": "rating must be a number.",
        "number.min": "rating must be at least 0.",
        "number.max": "rating must be at most 5.",
        "any.required": "rating is required."
      }),
      suggestions:stringValidation("suggestions",false)
  })
}


export default {
  socialLoginSchema,
  registerSchema,
  loginSchema,
  forgetPasswordSchema,
  verifyOtpSchema,
  resendOtpSchema,
  resetPasswordSchema
}