import express from "express";
import Stripe from "stripe";
import User from "../model/user.model";
import subscriptionModel from "../model/subscription.model";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const router = express.Router();

export const stripeController = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }


    if (!user.stripeId) {
      const customer = await stripe.customers.create({
        email: user.email,
        // name: user.firstName,
        metadata: {
          userId: user._id.toString(),
        },
      });
      user.stripeId = customer.id
      console.log(customer)
    }
    await user.save()
    console.log("stripeID....", user.stripeId)
    const existingSubscription = await subscriptionModel.findOne({
      stripeSubscriptionId: user.subscriptionId,
      status: { $in: ["active", "trialing"] },
      currentPeriodEnd: { $gte: new Date() }, // not expired
    }).lean();

    if (existingSubscription) {
      return res.status(200).json({
        message: "User already has an active subscription",
        subscription: existingSubscription,
      });
    }


    // 3. Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!, // must exist
          quantity: 1,
        },
      ],
      customer: user.stripeId,
      success_url: "https://16.170.13.143:8000/public/success.html",
      cancel_url: "https://16.170.13.143:8000/public/cancel.html",
    });
    console.log(session)

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: err.message });
  }
};



export const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.stripeId) {
      return res.status(404).json({ error: "User not found or not linked with Stripe" });
    }

    // Find the active subscription
    const subscription = await subscriptionModel.findOne({
      // stripeCustomerId: user.stripeId,
      stripeSubscriptionId:user.subscriptionId,
      status: { $in: ["active", "trialing"] },
    });

    if (!subscription) {
      return res.status(404).json({ error: "No active subscription found" });
    }

    // Cancel on Stripe
    const canceled = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true, // set to false if you want immediate cancellation
    });

    // Update in DB
    // subscription.status = canceled.status; // usually becomes "canceled" or "active" until period ends
    // subscription.cancelAt = canceled.cancel_at ? new Date(canceled.cancel_at * 1000) : null;
    // await subscription.save();

    res.status(200).json({
      message: "Subscription canceled successfully",
      subscription: subscription,
    });
  } catch (err: any) {
    console.error("Cancel subscription error:", err);
    res.status(500).json({ error: err.message });
  }
};



