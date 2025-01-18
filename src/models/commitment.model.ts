import { model, Schema } from "mongoose";
import { Commitment, CommitmentModel } from "../types/commitment.js";

const commitmentSchema = new Schema<Commitment, CommitmentModel>(
  {
    commitId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    author: {
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      username: {
        type: String,
        required: true,
      },
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "low",
    },
    impact: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "low",
    },
    timestamp: {
      type: Date,
      required: true,
    },
    repository: {
      name: {
        type: String,
        required: true,
      },
      fullName: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    changes: {
      type: Object,
      required: true,
    },
    metadata: {
      type: Object,
      required: true,
    },
    channels: {
      type: [String],
      required: true,
    },
    appInstance: {
      type: Schema.Types.ObjectId,
      ref: "AppInstance",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

commitmentSchema.index({ commitId: 1 });
commitmentSchema.index({ "repository.fullName": 1 });
commitmentSchema.index({ timestamp: -1 });

const Commitment = model<Commitment, CommitmentModel>(
  "Commitment",
  commitmentSchema
);

export default Commitment;
