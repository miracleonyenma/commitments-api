// src/types/commitment.ts
import { Document, Model, Types } from "mongoose";

export type CommitmentPriority = "high" | "medium" | "low";
export type CommitmentImpact = "high" | "medium" | "low";
export type CommitmentFileStatus = "added" | "modified" | "removed";

// Custom sort fields specific to commitments
export type CommitmentSortField =
  | "createdAt"
  | "updatedAt"
  | "timestamp"
  | "priority"
  | "impact"
  | "author.name";

export interface CommitmentFilter {
  repository?: string;
  priority?: CommitmentPriority;
  impact?: CommitmentImpact;
  author?: string;
  branch?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string; // Search in title and description
  fileStatus?: CommitmentFileStatus;
  channels?: string[];
}

export interface CommitmentSort {
  by?: CommitmentSortField;
  direction?: "asc" | "desc";
}

export interface GetCommitmentsParams {
  page?: number;
  limit?: number;
  filter?: CommitmentFilter;
  sort?: CommitmentSort;
  populate?: Array<"author" | "repository" | "changes">;
}

export type CommitmentAuthor = {
  name: string;
  email: string;
  username: string;
};

export type CommitmentChange = {
  fileName: string;
  status: "added" | "modified" | "removed";
  patch?: string;
};

export type CommitmentStats = {
  additions: number;
  deletions: number;
  total: number;
};

export type Commitment = Document & {
  commitId: string;
  title: string;
  description: string;
  author: CommitmentAuthor;
  priority: "high" | "medium" | "low";
  impact: "high" | "medium" | "low";
  timestamp: Date;
  repository: {
    name: string;
    fullName: string;
    url: string;
  };
  changes: {
    files: CommitmentChange[];
    stats?: CommitmentStats;
  };
  channels: string[];
  metadata: {
    branch: string;
    compareUrl: string;
  };
  appInstance: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type CommitmentInput = {
  title: string;
  description?: string;
  priority?: "high" | "medium" | "low";
  impact?: "high" | "medium" | "low";
  channels?: string[];
};

export type CommitmentModel = Model<Commitment>;
