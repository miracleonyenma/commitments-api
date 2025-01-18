// src/services/announcement.services.ts
import { Commitment } from "../types/commitment.js";
import {
  NotificationChannel,
  SendNotificationParams,
} from "../types/notifications.js";
import { genAnnouncementContent } from "../utils/ai/models/announcementModel.js";

export class AnnouncementService {
  private static generateContextForAI(commitments: Commitment[]): string {
    return `
      Repository: ${commitments[0].repository.fullName}
      Branch: ${commitments[0].metadata.branch}
      Time Period: ${new Date(
        Math.min(...commitments.map((c) => c.timestamp.getTime()))
      ).toLocaleDateString()} to ${new Date(
      Math.max(...commitments.map((c) => c.timestamp.getTime()))
    ).toLocaleDateString()}
      
      Changes Summary:
      - Total Commits: ${commitments.length}
      - Files Changed: ${
        new Set(
          commitments.flatMap((c) => c.changes.files.map((f) => f.fileName))
        ).size
      }
      - Total Additions: ${commitments.reduce(
        (sum, c) => sum + c.changes.stats.additions,
        0
      )}
      - Total Deletions: ${commitments.reduce(
        (sum, c) => sum + c.changes.stats.deletions,
        0
      )}
      
      Commit Details:
      ${commitments
        .map(
          (c) => `
        - ${c.title}
          Impact: ${c.impact}
          Priority: ${c.priority}
          Files: ${c.changes.files.map((f) => f.fileName).join(", ")}
          Description: ${c.description}
      `
        )
        .join("\n")}
    `.trim();
  }

  public async generateAnnouncement(
    commitments: Commitment[]
  ): Promise<string> {
    const context = AnnouncementService.generateContextForAI(commitments);

    const content = await genAnnouncementContent(context);

    return content;
  }

  public async sendAnnouncement(params: SendNotificationParams): Promise<void> {
    const { channel, content, recipients } = params;

    switch (channel) {
      case NotificationChannel.EMAIL:
        await this.sendEmailNotification(content, recipients);
        break;
      case NotificationChannel.SLACK:
        await this.sendSlackNotification(content, recipients);
        break;
      case NotificationChannel.TELEGRAM:
        await this.sendTelegramNotification(content, recipients);
        break;
      default:
        throw new Error(`Unsupported notification channel: ${channel}`);
    }
  }

  private async sendEmailNotification(
    content: string,
    recipients: string[]
  ): Promise<void> {
    // Implementation for sending email notifications
    // This would use your existing mail utility
  }

  private async sendSlackNotification(
    content: string,
    recipients: string[]
  ): Promise<void> {
    // Implementation for sending Slack notifications
  }

  private async sendTelegramNotification(
    content: string,
    recipients: string[]
  ): Promise<void> {
    // Implementation for sending Telegram notifications
  }
}
