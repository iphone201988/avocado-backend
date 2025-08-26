import express from "express";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY  as string);

const router = express.Router();

const stripeController= async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // e.g. price_12345
          quantity: 1,
        },
      ],
      success_url: "http://16.170.13.143:8000/success",
      cancel_url: "http://16.170.13.143:8000/cancel",
    });

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export default stripeController;
