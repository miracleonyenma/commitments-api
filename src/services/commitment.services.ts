// src/services/commitment.services.ts
import { App, Octokit } from "octokit";
import { PushEvent, WebhookEvent } from "@octokit/webhooks-types";
import {
  CommitmentFilter,
  CommitmentGroup,
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
import { DetailsConfig } from "../types/details.js";

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

    if (filter.commitIds) {
      query.commitId = { $in: filter.commitIds };
    }

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

  private categorizeCommitType(message: string): string {
    const types = new Map([
      [/^feat(\(.*?\))?:/, "Feature"],
      [/^fix(\(.*?\))?:/, "Bug Fix"],
      [/^docs(\(.*?\))?:/, "Documentation"],
      [/^style(\(.*?\))?:/, "Styling"],
      [/^refactor(\(.*?\))?:/, "Refactor"],
      [/^test(\(.*?\))?:/, "Testing"],
      [/^chore(\(.*?\))?:/, "Maintenance"],
    ]);

    for (const [pattern, type] of types) {
      if (pattern.test(message)) {
        return type;
      }
    }

    return "Other";
  }

  private groupCommitments(
    commitments: CommitmentType[],
    groupBy: DetailsConfig["groupBy"]
  ): CommitmentGroup[] {
    if (!groupBy) return [{ key: "all", commitments }];

    const groups = new Map<string, CommitmentType[]>();

    commitments.forEach((commitment) => {
      let key: string;
      switch (groupBy) {
        case "priority":
          key = commitment.priority;
          break;
        case "impact":
          key = commitment.impact;
          break;
        case "author":
          key = commitment.author.username || commitment.author.name;
          break;
        case "type":
          key = this.categorizeCommitType(commitment.title);
          break;
        default:
          key = "unknown";
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(commitment);
    });

    return Array.from(groups.entries()).map(([key, commitments]) => ({
      key,
      commitments,
    }));
  }

  private generateStats(commitments: CommitmentType[]): string {
    const totalCommits = commitments.length;
    const totalFiles = commitments.reduce(
      (acc, c) => acc + c.changes.files.length,
      0
    );
    const stats = commitments.reduce(
      (acc, c) => ({
        additions: acc.additions + c.changes.stats.additions,
        deletions: acc.deletions + c.changes.stats.deletions,
      }),
      { additions: 0, deletions: 0 }
    );

    return `
📊 Statistics:
- Total commits: ${totalCommits}
- Files changed: ${totalFiles}
- Lines added: ${stats.additions}
- Lines removed: ${stats.deletions}
`;
  }

  private formatFileChanges(files: CommitmentType["changes"]["files"]): string {
    return files
      .map((file) => `- ${file.fileName} (${file.status})`)
      .join("\n");
  }

  private async generateMarkdownDetails(
    commitments: CommitmentType[],
    config: DetailsConfig
  ): Promise<string> {
    const groups = this.groupCommitments(commitments, config.groupBy);
    const date = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let details = `# Update Details - ${date}\n\n`;

    if (config.includeStats) {
      details += `${this.generateStats(commitments)}\n`;
    }

    for (const group of groups) {
      details += `\n## ${group.key}\n`;

      for (const commitment of group.commitments) {
        details += `\n### ${commitment.title}\n`;

        if (commitment.description) {
          details += `${commitment.description}\n`;
        }

        details += `\n🔍 Details:\n`;
        details += `- Author: ${commitment.author.name} (@${commitment.author.username})\n`;
        details += `- Priority: ${commitment.priority}\n`;
        details += `- Impact: ${commitment.impact}\n`;

        if (config.includeFileChanges && commitment.changes.files.length > 0) {
          details += `\n📝 Changed Files:\n`;
          details += this.formatFileChanges(commitment.changes.files);
          details += "\n";
        }
      }
    }

    return details;
  }

  public async generateDetails(
    filter: CommitmentFilter,
    config: DetailsConfig = {
      groupBy: "type",
      format: "markdown",
      includeStats: true,
      includeFileChanges: true,
    }
  ): Promise<string> {
    const { commitments } = await this.getCommitments({
      filter,
      sort: { by: "timestamp", direction: "desc" },
    });

    switch (config.format) {
      case "html":
        throw new Error("HTML format not implemented yet");
      case "markdown":
      default:
        return this.generateMarkdownDetails(commitments, config);
    }
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
