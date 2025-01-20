import { Document, Model, Schema } from "mongoose";

type Team = {
  name: string;
  slug: string;
  description: string;
  members: Schema.Types.ObjectId[];
  projects: Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
};

type TeamDocument = Team & Document;

type TeamModel = Model<TeamDocument>;

export { Team, TeamDocument, TeamModel };
