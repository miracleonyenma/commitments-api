// src/services/feed.services.ts
import { Commitment } from "../types/commitment.js";
import Feed from "../models/feed.model.js";
import { AnnouncementService } from "./announcement.services.js";
import Subscription from "../models/subscription.model.js";
import { Project, ProjectDocument } from "../types/project.js";
import { FeedDocument } from "../types/feed.js";
import { UserDocument } from "../types/user.js";
import paginateCollection from "../utils/paginate.js";

export class FeedService {
  private announcementService: AnnouncementService;

  constructor() {
    this.announcementService = new AnnouncementService();
  }

  public async createFeedEntry(
    project: ProjectDocument,
    commitments: Commitment[],
    details: string,
    type: "announcement" | "changelog"
  ) {
    console.log("creating feed entry: ", {
      project,
      type,
    });

    // Generate content based on type
    const content =
      type === "announcement"
        ? await this.announcementService.generateAnnouncement(commitments)
        : this.generateChangelog(commitments);

    // Create feed entry
    const feed = new Feed({
      project: project._id,
      type,
      content,
      details,
      metadata: {
        commitments: commitments.map((c) => c._id),
        compareUrl: commitments[0]?.metadata?.compareUrl,
        branch: commitments[0]?.metadata?.branch,
      },
    });

    await feed.save();

    // Notify subscribers
    await this.notifySubscribers(project, feed);

    return feed;
  }

  private generateChangelog(commitments: Commitment[]): string {
    // Group commits by type/impact
    const grouped = commitments.reduce((acc, commit) => {
      const type = this.determineChangelogType(commit);
      if (!acc[type]) acc[type] = [];
      acc[type].push(commit);
      return acc;
    }, {} as Record<string, Commitment[]>);

    // Format changelog
    return Object.entries(grouped)
      .map(
        ([type, commits]) => `
### ${type}

${commits
  .map(
    (commit) =>
      `- ${commit.title} ([${commit.commitId.slice(0, 7)}](${
        commit.repository.url
      }/commit/${commit.commitId}))`
  )
  .join("\n")}
      `
      )
      .join("\n");
  }

  private determineChangelogType(commit: Commitment): string {
    if (commit.impact === "high") return "Breaking Changes";
    if (commit.priority === "high") return "Fixed";
    if (commit.title.toLowerCase().includes("feat")) return "Features";
    return "Other Changes";
  }

  private async notifySubscribers(
    project: ProjectDocument,
    feed: FeedDocument
  ) {
    // Get all relevant subscriptions
    const subscriptions = await Subscription.find({
      $or: [{ project: project._id }, { team: project.team }],
    }).populate<{ user: UserDocument }>("user");

    // Send notifications through configured channels
    for (const subscription of subscriptions) {
      for (const channel of subscription.channels) {
        await this.announcementService.sendAnnouncement({
          channel: channel.type,
          content: feed.content,
          recipients: [subscription.user?.email], // Or other channel-specific identifier
          metadata: {
            feedId: feed._id,
            projectId: project._id,
            channelConfig: channel.config,
          },
        });
      }
    }
  }

  public async getFeedByProject(
    projectId: string,
    options: {
      page?: number;
      limit?: number;
      type?: "announcement" | "changelog";
    } = {}
  ) {
    const { page = 1, limit = 10, type } = options;

    const query = { project: projectId };
    if (type) query["type"] = type;

    const paginatedFeed = await paginateCollection(
      Feed,
      {
        page,
        limit,
      },
      {
        filter: query,
        sort: { by: "createdAt", direction: "desc" },
        populate: "project",
      }
    );

    return {
      data: paginatedFeed.data,
      meta: paginatedFeed.meta,
    };
  }
}
