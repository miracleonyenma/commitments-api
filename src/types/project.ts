import { Document, Model, Schema } from "mongoose";

export type Project = {
  name: string;
  slug: string;
  description: string;
  repository: Repository;
  visibility: "public" | "team";
  team?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export type ProjectDocument = Project & Document;

export type ProjectModel = Model<ProjectDocument>;

export type Repository = {
  fullName: string;
  url: string;
  owner: string;
};

export type CreateProjectInput = {
  slug: string;
  name: string;
  description?: string;
  repository?: Repository;
  teamId?: string;
};

export type UpdateProjectInput = {
  name?: string;
  description?: string;
  repository?: Repository;
};

export type ProjectVisibility = "public" | "team";

export type GetProjectsParams = {
  visibility?: ProjectVisibility;
  teamId?: string;
  page?: number;
  limit?: number;
};
