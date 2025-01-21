import { config } from "dotenv";

import { App } from "octokit";
import { createNodeMiddleware } from "@octokit/webhooks";

config();

const appId = process.env.GITHUB_APP_ID;
const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
const privateKey = process.env.GITHUB_PRIVATE_KEY;

const githubApp = new App({
  appId: appId,
  privateKey: privateKey,
  webhooks: {
    secret: webhookSecret,
  },
});

const githubWebhooks = createNodeMiddleware(githubApp.webhooks, {
  path: "/webhook/github",
});

export { githubApp, githubWebhooks };
