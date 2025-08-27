import User from "../model/user.model";
import subscriptionModel from "../model/subscription.model";

export const hasActiveSubscription = async (userId: string) => {
  try {
    const user = await User.findById(userId).populate("stripeId");

    if (!user || !user.stripeId || !user.subscriptionId) {
      return { valid: false, reason: "No active subscription found" };
    }

    const subscription = await subscriptionModel.find({stripeSubscriptionId:user.subscriptionId});
    console.log("subscription..",subscription)
    if (!subscription) {
      return { valid: false, reason: "Subscription not found" };
    }
    

    // Allowed statuses
    const validStatuses = ["active", "trialing"];
    console.log(subscription[0].status)
    if (subscription[0].status!=="active") {
      return { valid: false, reason: "Subscription is not active" };
    }

    // Check expiration
    const now = new Date();
    if (subscription.currentPeriodEnd && subscription.currentPeriodEnd < now) {
      return { valid: false, reason: "Subscription expired" };
    }

    // ✅ User has valid subscription
    return { valid: true, subscription };
  } catch (err) {
    console.error("Subscription check error:", err);
    return { valid: false, reason: "Internal server error" };
  }
};
