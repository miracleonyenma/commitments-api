import { Document, Model, Schema } from "mongoose";

type Member = {
  user: Schema.Types.ObjectId;
  role: "owner" | "admin" | "member";
  team: Schema.Types.ObjectId;
  joinedAt: Date;
};

type MemberDocument = Member & Document;

type MemberModel = Model<MemberDocument>;

export { Member, MemberDocument, MemberModel };
