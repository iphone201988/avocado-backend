import { Request, Response, NextFunction } from 'express';
import ErrorHandler from '../utils/ErrorHandler';
import { SUCCESS } from '../utils/helper';
import ContactUsModel from '../model/contactUs.model';

export const    contactUs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { email,firstName,lastName,message} = req.body;
    // const existing=await ContactUsModel.findOne({email});
    // const data=await ContactUsModel.findOne({email});
    // if(existing){
    //     return SUCCESS(res, 201, 'We will contact you soon', {
    //   data
    // });
    // }
    const lowercaseEmail=email?.toLowerCase();
    const contactUs = await ContactUsModel.create({ email:lowercaseEmail,firstName,lastName,message});

    return SUCCESS(res, 201, 'We will contact you soon', {
      contactUs,
    });
  } catch (error) {
    next(error);
  }
};