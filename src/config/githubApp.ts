import { config } from "dotenv";

import { App } from "octokit";
import { createNodeMiddleware } from "@octokit/webhooks";
import fs from "fs";

config();

const appId = process.env.GITHUB_APP_ID;
const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
const privateKeyPath = process.env.PRIVATE_KEY_PATH;

const privateKey = fs.readFileSync(privateKeyPath, "utf8");

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
