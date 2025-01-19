import { Document, Model, Schema } from "mongoose";

type Team = {
  name: string;
  slug: string;
  description: string;
  members: Array<{
    user: Schema.Types.ObjectId;
    role: "owner" | "admin" | "member";
    joinedAt: Date;
  }>;
  projects: Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
};

type TeamDocument = Team & Document;

type TeamModel = Model<TeamDocument>;

export { Team, TeamDocument, TeamModel };
