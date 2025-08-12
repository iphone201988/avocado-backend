import { Request, Response, NextFunction } from 'express';
import ErrorHandler from '../utils/ErrorHandler';
import { SUCCESS } from '../utils/helper';
import NewsletterSubscription from '../model/communitySubscription.model';

// Subscribe to newsletter
export const    subscribeToNewsletter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return next(new ErrorHandler('A valid email is required.', 400));
    }

    const lowercaseEmail=email?.toLowerCase();

    const existing = await NewsletterSubscription.findOne({ email:lowercaseEmail });

    if (existing) {
      return next(new ErrorHandler('Email is already subscribed to the newsletter.', 400));
    }

    const subscription = await NewsletterSubscription.create({ email:lowercaseEmail });

    return SUCCESS(res, 201, 'Successfully subscribed to the newsletter.', {
      subscription,
    });
  } catch (error) {
    next(error);
  }
};

// Get all subscribers (admin use)
export const getAllSubscribers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const subscribers = await NewsletterSubscription.find().sort({ subscribedAt: -1 });
    return SUCCESS(res, 200, 'Fetched all newsletter subscribers.', { subscribers });
  } catch (error) {
    next(error);
  }
};

// Unsubscribe (optional)
export const unsubscribeFromNewsletter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { email } = req.body;
    const lowercaseEmail=email?.toLowerCase();
    const deleted = await NewsletterSubscription.findOneAndDelete({ email:lowercaseEmail });

    if (!deleted) {
      return next(new ErrorHandler('Email is not subscribed.', 404));
    }

    return SUCCESS(res, 200, 'Successfully unsubscribed from the newsletter.');
  } catch (error) {
    next(error);
  }
};
