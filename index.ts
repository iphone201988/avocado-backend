import express, { Request, Response } from "express";
import "dotenv/config";
import morgan from "morgan";
import { connectToDB } from "./src/utils/helper";
import { errorMiddleware } from "./src/middleware/error.middleware";
import router from "./src/route/index.route";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import bodyParser from "body-parser";
import User from "./src/model/user.model";
import subscriptionModel from "./src/model/subscription.model";
import userSchema from "./src/schema/user.schema";
import fs from 'fs';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
import https from "https";
import { File } from "node:buffer";

// Polyfill for Node 18
if (!globalThis.File) {
  (globalThis as any).File = File;
}






const app = express();
const endpointSecret = 'whsec_G75r8cf4gc821pfAw8GZRD86zryv0OKG';

app.post("/webhook", express.raw({ type: "application/json" }), async (req:any, res:any) => {
  let event:any;

  const sig = req.headers["stripe-signature"];

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed:", err.message);
    return res.sendStatus(400);
  }

  // Handle events
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("✅ Checkout completed:", session.id);

      // Get customer + subscription IDs
      const stripeCustomerId = session.customer as string;
      const stripeSubscriptionId = session.subscription as string;

      // Find the user by stripeCustomerId
      const user = await User.findOne({ stripeId:stripeCustomerId });
      if (!user) break;

      // Check if user already has a subscription
      let existingSub = await subscriptionModel.findOne({
      stripeSubscriptionId
      });

      if (!existingSub) {
        // Create new subscription document
        existingSub = await subscriptionModel.create({
          stripeCustomerId,
          stripeSubscriptionId,
          priceId: session.metadata?.priceId,
          status: "incomplete", // until Stripe confirms
        });

        
      }
      user.subscriptionId = existingSub.stripeSubscriptionId;
        await user.save();

      break;
    }

    case "customer.subscription.created": {
      const subscription:any = event.data.object ;
      console.log("📅 Subscription created:", subscription.id);

      // Upsert subscription
      await subscriptionModel.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        {
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          priceId: subscription.items.data[0].price.id,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000)
            : null,
          planAmount: subscription.items.data[0].price.unit_amount / 100,
          planInterval: subscription.items.data[0].price.recurring.interval,
        },
        { upsert: true, new: true }
      );
      break;
    }
    case "customer.subscription.updated": {
      const 
      subscription = event.data.object ;
      console.log("🔄 Subscription updated:", subscription.id);

      await subscriptionModel.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        {
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000)
            : null,
        },
        { new: true }
      );
      break;
    }


 
    case "customer.subscription.deleted": {
      const subscription = event.data.object ;
      console.log("❌ Subscription canceled:", subscription.id);

      const sub = await subscriptionModel.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        { status: "canceled", canceledAt: new Date() },
        { new: true }
      );

      if (sub) {
        // Unlink subscription from user
        await User.findOneAndUpdate(
          { stripeId: subscription.customer as string },
          { $unset: { subscription: "" } }
        );
      }

      break;
    }
         
     case "invoice.payment_succeeded": {
        const invoice = event.data.object ;
        console.log("💰 Invoice paid:", invoice.id);

        await subscriptionModel.findOneAndUpdate(
          { stripeSubscriptionId: invoice.subscription as string },
          {
            currentPeriodEnd: new Date(
              invoice.lines.data[0].period.end * 1000
            ),
            status: "active",
          }
        );
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.log("⚠️ Invoice payment failed:", invoice.id);

        await subscriptionModel.findOneAndUpdate(
          { stripeSubscriptionId: invoice.subscription as string },
          { status: "past_due" }
        );
        break;
      }
    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }


  // Respond to Stripe
  res.json({ received: true });
});

app.use(morgan("tiny"));
app.use(cors());



// app.get("/success", (req: Request, res: Response) => {
//  app.get("/success", (req: Request, res: Response) => {
//   app.use(express.static(path.resolve("src/public")));

// });
// });

const options = {
  key: fs.readFileSync(path.resolve(__dirname, "../ssl/private.key"), 'utf8'),
  cert: fs.readFileSync(path.resolve(__dirname, "../ssl/certificate.crt"), 'utf8'),
  ca: fs.readFileSync(path.resolve(__dirname, "../ssl/ca_bundle.crt"), 'utf8'),
};

app.get("/cancel", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "src", "public", "cancel.html"));
});


app.use("/uploads/audio", express.static(path.join(__dirname, "uploads/audio")));
app.use("/public", express.static(path.join(__dirname, "../public")));



app.use("/uploads", express.static(path.join(__dirname, "../uploads")));



app.use(express.json());



// const app2 = express();

app.use("/api/v1", router);


app.use(errorMiddleware);

connectToDB()
  .then(() => {
    console.log("Connected to DB successfully", process.env.MONGO_URI);

    // Create HTTPS server
    https.createServer(options, app).listen(process.env.PORT, () => {
      console.log(`🚀 HTTPS Server is running on port: ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("Error connecting to DB", error);
  });





