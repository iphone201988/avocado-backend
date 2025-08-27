import { required } from "joi";
import mongoose, { Schema } from "mongoose";


const subscriptionSchema = new mongoose.Schema({
  stripeSubscriptionId: { type: String, required: true },
  stripeCustomerId: { type: String },
  priceId: { type: String},
  status: { type: String, enum: [
    "incomplete",
    "incomplete_expired",
    // "trialing",
    "active",
    "past_due",
    "canceled",
    "unpaid"
  ], default: "incomplete" },
  currentPeriodStart: { type: Date },
  currentPeriodEnd: { type: Date },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  canceledAt: { type: Date },
  defaultPaymentMethod: { type: String },
  planAmount: { type: Number },
  planInterval: { type: String }
});

const subscriptionModel=mongoose.model(
    'subscriptionSchema',
    subscriptionSchema
);

export default subscriptionModel


