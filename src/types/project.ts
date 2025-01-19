import { Document, Model, Schema } from "mongoose";

export type Project = Document & {
  name: string;
  slug: string;
  description: string;
  repository: {
    fullName: string;
    url: string;
  };
  visibility: "public" | "team";
  team?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export type ProjectDocument = Project & Document;

export type ProjectModel = Model<ProjectDocument>;
