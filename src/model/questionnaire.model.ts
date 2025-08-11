import { required } from "joi";
import mongoose, { Schema } from "mongoose";

const QuestionaireSchema = new Schema(
    {
      userId: {
        type: String,
        required: true,
        // unique: true,
        lowercase: true,
        trim: true,
      },
      moduleType:{
        type:String,
        required:true
    },
    rating:{
        type:Number,
        required:true
    },
    suggestions:{
        type:String
    }
      
    },
    { timestamps: true }
  );
  
  const QuestionaireModel = mongoose.model(
    'QuestionaireSchema',
    QuestionaireSchema
  );
  
  export default QuestionaireModel;