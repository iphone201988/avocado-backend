import { Request, Response, NextFunction } from 'express';
import { SUCCESS } from '../utils/helper';
import QuestionaireModel from '../model/questionnaire.model';

export const    questionaire = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const {moduleType,rating,suggestions } = req.body;
    const userId=req.user._id
    // const existing=await ContactUsModel.findOne({email});
    // const data=await ContactUsModel.findOne({email});
    // if(existing){
    //     return SUCCESS(res, 201, 'We will contact you soon', {
    //   data
    // });
    // }
    const questionairedata = await QuestionaireModel.create({moduleType,rating,suggestions,userId });

    return SUCCESS(res, 201, 'Successfully Submitted', {
      questionairedata,
    });
  } catch (error) {
    next(error);
  }
};