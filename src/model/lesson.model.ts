import mongoose, { Schema, Document, Types } from 'mongoose';
import { ScoredLessonDocument } from '../schema/lesson.schema';



const ScoredLessonSchema = new Schema<ScoredLessonDocument>(
  {
    topic: { type: String, required: true },
    level: { type: String, required: true },
    formality: { type: String, required: true },
    style:{type:String},
    writingType: { type: String },
    type: {
      type: String,
      enum: ['lessonBuilder', 'skillBuilder','reading', 'writing', 'listening', 'speaking'],
      required: true
    },
    modules: [
      {
        type: {
          type: String,
          enum: ['reading', 'writing', 'listening', 'speaking'],
          required: true
        },
        module: {
          type: Schema.Types.ObjectId,
          ref: 'Module',
          required: true
        }
      }
    ],
    userId:{
      type:Schema.Types.ObjectId,
      ref:'User',
      //required:true
    },
  },
  { timestamps: true }
);

export const ScoredLessonModel = mongoose.model<ScoredLessonDocument>('ScoredLesson', ScoredLessonSchema);