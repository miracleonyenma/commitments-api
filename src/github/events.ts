// ./src/github/events.ts

import { PushEvent } from "@octokit/webhooks-types";
import { githubApp } from "../config/githubApp.js";
import { getAppInstance } from "../services/appInstance.services.js";
import { CommitmentService } from "../services/commitment.services.js";
import { AnnouncementService } from "../services/announcement.services.js";

export const initEvents = () => {
  githubApp.webhooks.on("push", async (event) => {
    console.log({ event });
    const payload = event.payload as PushEvent;

    const service = new CommitmentService();
    service.init(payload.installation.id);
    const commitments = await service.processWebhookPayload(payload);

    console.log("commitments", commitments);

    // Generate details
    const details = await service.generateDetails({
      commitIds: commitments.map((c) => c.commitId),
    });

    console.log("details", details);

    // Generate and send announcement
    const announcementService = new AnnouncementService();
    const announcement = await announcementService.generateAnnouncement(
      commitments
    );

    console.log("announcement", announcement);
  });
};
