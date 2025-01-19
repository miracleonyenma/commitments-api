import { model, Schema } from "mongoose";
import { FeedDocument, FeedModel } from "../types/feed.js";

const feedSchema = new Schema<FeedDocument, FeedModel>(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    type: {
      type: String,
      enum: ["announcement", "changelog"],
      required: true,
    },
    content: { type: String, required: true },
    metadata: {
      commitments: [{ type: Schema.Types.ObjectId, ref: "Commitment" }],
      compareUrl: String,
      branch: String,
    },
  },
  { timestamps: true }
);

const Feed = model<FeedDocument, FeedModel>("Feed", feedSchema);

export default Feed;
