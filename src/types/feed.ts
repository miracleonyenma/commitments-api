import { Document, Model, Schema } from "mongoose";

type Feed = {
  project: Schema.Types.ObjectId;
  type: "announcement" | "changelog";
  content: string;
  metadata: {
    commitments: Schema.Types.ObjectId[];
    compareUrl?: string;
    branch?: string;
  };
  createdAt: Date;
  updatedAt: Date;
};

type FeedDocument = Feed & Document;

type FeedModel = Model<FeedDocument>;

export { Feed, FeedDocument, FeedModel };
