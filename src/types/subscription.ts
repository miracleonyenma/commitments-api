import { Document, Model, Schema } from "mongoose";
import { NotificationChannel } from "./notifications.js";

type Subscription = {
  user: Schema.Types.ObjectId;
  project?: Schema.Types.ObjectId;
  team?: Schema.Types.ObjectId;
  channels: {
    type: NotificationChannel;
    config: Record<string, any>;
  }[];
  createdAt: Date;
  updatedAt: Date;
};

type SubscriptionDocument = Subscription & Document;

type SubscriptionModel = Model<SubscriptionDocument>;

export { Subscription, SubscriptionDocument, SubscriptionModel };
