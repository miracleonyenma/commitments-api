import { model, Schema } from "mongoose";
import { MemberDocument, MemberModel } from "../types/member.js";

const memberSchema = new Schema<MemberDocument, MemberModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      required: true,
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: "Team",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Member = model<MemberDocument, MemberModel>("Member", memberSchema);

export default Member;
