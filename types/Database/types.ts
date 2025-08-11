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
  socialLinkedAccounts?: ISocialLinkedAccount[];
  email?: string;
  password?: string;
  language?: string;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  deviceToken?: string;
  deviceType?: 1;
  jti?: string;
  otp?: number;
  otpExpiry?: Date;
  otpVerified?: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
    lessons?: {
    moduleId: Types.ObjectId; // or string if you're storing as string
  }[];
  matchPassword(password: string): Promise<boolean>;
}
