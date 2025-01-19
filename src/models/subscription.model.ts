import { model, Schema } from "mongoose";
import { NotificationChannel } from "../types/notifications.js";
import {
  SubscriptionDocument,
  SubscriptionModel,
} from "../types/subscription.js";

const subscriptionSchema = new Schema<SubscriptionDocument, SubscriptionModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    project: { type: Schema.Types.ObjectId, ref: "Project" },
    team: { type: Schema.Types.ObjectId, ref: "Team" },
    channels: [
      {
        type: {
          type: String,
          enum: Object.values(NotificationChannel),
          required: true,
        },
        config: { type: Schema.Types.Mixed, required: true },
      },
    ],
  },
  { timestamps: true }
);

// Ensure either project or team is specified, but not both
subscriptionSchema.pre("save", function (next) {
  if ((!this.project && !this.team) || (this.project && this.team)) {
    next(
      new Error("Subscription must have either project or team, but not both")
    );
  }
  next();
});

const Subscription = model<SubscriptionDocument, SubscriptionModel>(
  "Subscription",
  subscriptionSchema
);

export default Subscription;
