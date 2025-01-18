// ./src/github/events.ts

import { PushEvent } from "@octokit/webhooks-types";
import { githubApp } from "../config/githubApp.js";
import { getAppInstance } from "../services/appInstance.services.js";
import { CommitmentService } from "../services/commitment.services.js";

export const initEvents = () => {
  githubApp.webhooks.on("push", async (event) => {
    console.log({ event });
    const payload = event.payload as PushEvent;

    // const appInstance = await getAppInstance({
    //   owner: repository.owner.login,
    //   installationId: installation.id,
    //   repo: repository.name,
    // });

    // console.log("appInstance", appInstance);

    const service = new CommitmentService();
    service.init(payload.installation.id);
    const commitments = await service.processWebhookPayload(payload);

    console.log("commitments", commitments);
  });
};
