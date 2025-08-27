import mongoose, { Schema } from 'mongoose';
import { ModuleDocument } from '../schema/lesson.schema';

const ModuleSchema = new Schema<ModuleDocument>(
  {
    type: {
      type: String,
      enum: ['reading', 'listening', 'writing', 'speaking'],
      required: true,
    },
    paragraph: { type: String },
    questions: [{ type: String }],
    answers: [{ type: String }],
    task: { type: String },
    comprehension: { type: String },
    aiFeedback: { type: Schema.Types.Mixed }, // JSON object or array
    chatId:Schema.Types.ObjectId,
    subscriptionRequired:{type:Boolean}
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

export const ModuleModel = mongoose.model<ModuleDocument>('Module', ModuleSchema);