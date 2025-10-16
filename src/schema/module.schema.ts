import Joi from "joi";
import { ObjectIdValidation, numberValidation, stringValidation } from "./index";

export const getSpeakingChatByBuilderIdSchema = {
  params: Joi.object({
    builderId: ObjectIdValidation("Builder ID")
  }),
  query: Joi.object({
    page: numberValidation("Page", false, 1),
    limit: numberValidation("Limit", false, 1)
  })
};



export const generateFeedbackSchema = {
  params: Joi.object({
    type: Joi.string()
      .valid("reading", "listening", "writing", "speaking")
      .required()
      .messages({
        "any.only": `Type must be one of: reading, listening, writing, speaking.`,
        "any.required": "Type is required.",
        "string.base": "Type must be a string."
      })
  }),

  body: Joi.object({
    builderId: ObjectIdValidation("Builder ID"),
    
    answers: Joi.array().items(Joi.any()).optional()
      .messages({
        "array.base": "Answers must be an array."
      }),

    paragraph: stringValidation("Paragraph", false),

    response: stringValidation("Response", false),
    language:Joi.string()
      .optional()
      .valid("german","english")
      .messages({
        "any.only": `Language must be one of: "german","english"`,
        "any.required": "Language is required.",
        "string.base": "Language must be a string."
      })
  })
};



export const getBuilderByIdSchema = {
  params: Joi.object({
    builderId: ObjectIdValidation("Builder ID")
  })
};


export const getWordOrSentenceInsightsSchema = {
  query: Joi.object({
    text: stringValidation("Text"),
    language:Joi.string()
      .optional()
      .valid("German","English")
      .messages({
  })
})};

export const linkUserWithBuilderSchema = {
  body: Joi.object({
    builderId: ObjectIdValidation("Builder ID")
  })
};


export const generateAndStoreModuleSchema = {
  params: Joi.object({
    type: Joi.string()
      .valid("lessonBuilder", "reading", "listening", "writing", "speaking")
      .required()
      .messages({
        "any.only": "Type must be one of: lessonBuilder, reading, listening, writing, speaking.",
        "any.required": "Type is required.",
        "string.base": "Type must be a string.",
      }),
  }),

  body: Joi.object({
    topic: stringValidation("Topic"),
    level: stringValidation("Level"),
    formality: stringValidation("Formality"),
    writingType: stringValidation("Writing Type", false), 
    style: stringValidation("Style", false),
    language:Joi.string()
      .optional()
      .valid("German","English")
      .messages({
        "any.only": `Language must be one of: "german","english"`,
        "any.required": "Language is required.",
        "string.base": "Language must be a string."
      }),
      lengthOption:stringValidation("length option",false),
      length:numberValidation("length",false)
  }),
};




export const getModuleByBuilderAndTypeSchema = {
  params: Joi.object({
    builderId: ObjectIdValidation("Builder ID"),
    type: Joi.string()
      .valid("reading", "listening", "writing", "speaking")
      .required()
      .messages({
        "any.only": `Type must be one of: reading, listening, writing, speaking.`,
        "any.required": "Type is required.",
        "string.base": "Type must be a string."
      }),
  }),
};



export const chatWithSpeakingModuleSchema = {
  params: Joi.object({
    moduleId: ObjectIdValidation("Module ID")
  }),

  body: Joi.object({
    message: stringValidation("Message"),
    language:Joi.string()
      .optional()
      .valid("german","english")
      .messages({
        "any.only": `Language must be one of: "german","english"`,
        "any.required": "Language is required.",
        "string.base": "Language must be a string."
      })
  })
};


export const generateFullStoryLessonSchema = {
  body: Joi.object({
    title: stringValidation("Story Title", false),
    level: Joi.string()
      .valid("A1","A2","B1","B2","C1","C2") 
      .required()
      .messages({
        "any.required": "Language level is required.",
        "any.only": "Level must be one of A1,A2,B1,B2,C1,C2",
      }),
    genre: Joi.string()
      .optional()
      .messages({
        "string.base": "Genre must be a string.",
        "any.required": "Genre is required.",
      }),
      language:Joi.string()
      .optional()
      .valid("German","English")
      .messages({
        "any.only": `Language must be one of: "german","english"`,
        "any.required": "Language is required.",
        "string.base": "Language must be a string."
      }),

  }),
};