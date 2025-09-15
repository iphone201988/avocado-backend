import { Schema, model } from "mongoose";
import { deviceType, SocialLoginType } from "../utils/enums";
import { IUser } from "../../types/Database/types";

const userSchema = new Schema<IUser>(
  {
    socialLinkedAccounts: [{ provider: { type: Number, enum: [SocialLoginType.FACEBOOK, SocialLoginType.GOOGLE, SocialLoginType.X] }, id: { type: String } }],
    email: { type: String },
    password: { type: String },
    language: {
      type: String,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
    bio: { type: String },
    lessons: [
      {
        moduleId: {
          type: Schema.Types.ObjectId,
          ref: 'Module',
        },
      }
    ],
    lastOtpSentAt: { type: Date },
    deviceToken: { type: String },
    deviceType: { type: Number, enum: [deviceType.WEB] },
    jti: { type: String },
    otp: { type: Number },
    otpExpiry: { type: Date },
    otpVerified: { type: Boolean },
    isDeleted: { type: Boolean, default: false },
    stripeId: { type: String },
    subscriptionId: {
      type: String,
      ref: 'Subscription',
    },
    name: {
      type: String,
    },
    preferredLanguage:{
      type:String
    },
  },
  { timestamps: true }
);

const User = model<IUser>("User", userSchema);

export default User;
