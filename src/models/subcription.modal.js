import timespan from "jsonwebtoken/lib/timespan";
import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscription: {
      type: Schema.Types.ObjectId, // who is subcribing
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, // to whom the user is subcribing
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
