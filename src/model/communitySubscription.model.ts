import mongoose, { Schema } from "mongoose";
import { NewsletterSubscriptionDocument } from "../../types/Database/types";

const NewsletterSubscriptionSchema = new Schema<NewsletterSubscriptionDocument>(
    {
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },
      subscribedAt: {
        type: Date,
        default: Date.now,
      },
    },
    { timestamps: true }
  );
  
  const NewsletterSubscription = mongoose.model<NewsletterSubscriptionDocument>(
    'NewsletterSubscription',
    NewsletterSubscriptionSchema
  );
  
  export default NewsletterSubscription;