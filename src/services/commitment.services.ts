// src/services/commitment.services.ts
import { App, Octokit } from "octokit";
import { PushEvent, WebhookEvent } from "@octokit/webhooks-types";
import {
  CommitmentFilter,
  CommitmentInput,
  CommitmentSort,
  CommitmentSortField,
  Commitment as CommitmentType,
  GetCommitmentsParams,
} from "../types/commitment.js";
import Commitment from "../models/commitment.model.js";
import { FilterQuery } from "mongoose";
import paginateCollection from "../utils/paginate.js";
import { getAppInstance } from "./appInstance.services.js";
import { githubApp } from "../config/githubApp.js";

export class CommitmentService {
  private githubApp: App;
  private octokit: Octokit;

  constructor() {
    this.githubApp = githubApp;
  }

  public async init(installationId: number) {
    this.octokit = await githubApp.getInstallationOctokit(installationId);
  }

  private determinePriority(message: string): "high" | "medium" | "low" {
    const lowercaseMessage = message.toLowerCase();

    if (
      lowercaseMessage.includes("fix") ||
      lowercaseMessage.includes("hotfix") ||
      lowercaseMessage.includes("urgent")
    ) {
      return "high";
    }

    if (
      lowercaseMessage.includes("feat") ||
      lowercaseMessage.includes("update")
    ) {
      return "medium";
    }

    return "low";
  }

  private determineImpact(message: string): "high" | "medium" | "low" {
    const lowercaseMessage = message.toLowerCase();

    if (
      lowercaseMessage.includes("break") ||
      lowercaseMessage.includes("major")
    ) {
      return "high";
    }

    if (
      lowercaseMessage.includes("feature") ||
      lowercaseMessage.includes("enhancement")
    ) {
      return "medium";
    }

    return "low";
  }

  private async getDetailedCommitInfo(
    owner: string,
    repo: string,
    commitSha: string
  ) {
    const { data } = await this.octokit.request(
      "GET /repos/{owner}/{repo}/commits/{ref}",
      {
        owner,
        repo,
        ref: commitSha,
      }
    );
    return data;
  }

  public async processWebhookPayload(
    payload: PushEvent
  ): Promise<CommitmentType[]> {
    const commitments: CommitmentType[] = [];
    const [owner, repo] = payload.repository.full_name.split("/");

    const appInstance = await getAppInstance({
      owner,
      repo,
      installationId: payload.installation.id,
    });

    for (const commit of payload.commits) {
      const detailedCommit = await this.getDetailedCommitInfo(
        owner,
        repo,
        commit.id
      );

      const commitment = new Commitment({
        commitId: commit.id,
        title: commit.message.split("\n")[0],
        description: commit.message.split("\n").slice(1).join("\n").trim(),
        author: {
          name: commit.author.name,
          email: commit.author.email,
          username: commit.author.username,
        },
        priority: this.determinePriority(commit.message),
        impact: this.determineImpact(commit.message),
        timestamp: new Date(commit.timestamp),
        repository: {
          name: payload.repository.name,
          fullName: payload.repository.full_name,
          url: payload.repository.html_url,
        },
        changes: {
          files: detailedCommit.files.map((file) => ({
            fileName: file.filename,
            status: file.status as "added" | "modified" | "removed",
            patch: file.patch,
          })),
          stats: detailedCommit.stats,
        },
        channels: ["general"], // Default channel
        metadata: {
          branch: payload.ref.replace("refs/heads/", ""),
          compareUrl: payload.compare,
        },
        appInstance: appInstance,
      });

      await commitment.save();
      commitments.push(commitment);
    }

    return commitments;
  }

  private buildFilter(filter?: CommitmentFilter): FilterQuery<CommitmentType> {
    const query: FilterQuery<CommitmentType> = {};

    if (!filter) return query;

    if (filter.repository) {
      query["repository.fullName"] = filter.repository;
    }

    if (filter.priority) {
      query.priority = filter.priority;
    }

    if (filter.impact) {
      query.impact = filter.impact;
    }

    if (filter.author) {
      query["author.username"] = filter.author;
    }

    if (filter.branch) {
      query["metadata.branch"] = filter.branch;
    }

    if (filter.dateRange) {
      query.timestamp = {
        $gte: filter.dateRange.start,
        $lte: filter.dateRange.end,
      };
    }

    if (filter.search) {
      query.$or = [
        { title: { $regex: filter.search, $options: "i" } },
        { description: { $regex: filter.search, $options: "i" } },
      ];
    }

    if (filter.fileStatus) {
      query["changes.files.status"] = filter.fileStatus;
    }

    if (filter.channels && filter.channels.length > 0) {
      query.channels = { $in: filter.channels };
    }

    return query;
  }

  private validateSort(sort?: CommitmentSort) {
    if (!sort) return undefined;

    const validFields: CommitmentSortField[] = [
      "createdAt",
      "updatedAt",
      "timestamp",
      "priority",
      "impact",
      "author.name",
    ];

    if (sort.by && !validFields.includes(sort.by)) {
      throw new Error(
        `Invalid sort field. Must be one of: ${validFields.join(", ")}`
      );
    }

    return sort;
  }

  private getPopulateString(
    populate?: Array<"author" | "repository" | "changes">
  ): string {
    if (!populate || populate.length === 0) return "";
    return populate.join(" ");
  }

  public async getCommitments({
    page = 1,
    limit = 10,
    filter,
    sort,
    populate,
  }: GetCommitmentsParams = {}) {
    const validatedSort = this.validateSort(sort);
    const query = this.buildFilter(filter);
    const populateString = this.getPopulateString(populate);

    const result = await paginateCollection(
      Commitment,
      { page, limit },
      {
        filter: query,
        sort: validatedSort,
        populate: populateString,
      }
    );

    return {
      commitments: result.data,
      ...result.meta,
    };
  }

  // Example method to get commitment statistics
  public async getCommitmentStats(filter?: CommitmentFilter) {
    const query = this.buildFilter(filter);

    const stats = await Commitment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCommitments: { $sum: 1 },
          byPriority: {
            $push: {
              k: "$priority",
              v: 1,
            },
          },
          byImpact: {
            $push: {
              k: "$impact",
              v: 1,
            },
          },
          totalAdditions: { $sum: "$changes.stats.additions" },
          totalDeletions: { $sum: "$changes.stats.deletions" },
        },
      },
      {
        $project: {
          _id: 0,
          totalCommitments: 1,
          byPriority: { $arrayToObject: "$byPriority" },
          byImpact: { $arrayToObject: "$byImpact" },
          totalChanges: {
            additions: "$totalAdditions",
            deletions: "$totalDeletions",
          },
        },
      },
    ]);

    return stats[0] || null;
  }

  public async updateCommitment(commitId: string, input: CommitmentInput) {
    const commitment = await Commitment.findOneAndUpdate(
      { commitId },
      { $set: input },
      { new: true }
    );

    if (!commitment) {
      throw new Error("Commitment not found");
    }

    return commitment;
  }
}
