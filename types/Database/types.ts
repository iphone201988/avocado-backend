import { Document,Types } from "mongoose";


export interface ISocialLinkedAccount {
  provider: 1|2|3;
  id: string;
}
export interface NewsletterSubscriptionDocument extends Document {
  email: string;
  subscribedAt: Date;
}

export interface IUser extends Document {
  lastOtpSentAt: Date;
  preferredLanguage?:string
  bio?:string;
  socialLinkedAccounts?: ISocialLinkedAccount[];
  email?: string;
  password?: string;
  language?: string;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  name:string
  stripeId?:string,
  deviceToken?: string;
  deviceType?: 1;
  jti?: string;
  otp?: number;
  otpExpiry?: Date;
  otpVerified?: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  subscriptionId?: string; 
    lessons?: {
    moduleId: Types.ObjectId; // or string if you're storing as string
  }[];
  matchPassword(password: string): Promise<boolean>;
}
