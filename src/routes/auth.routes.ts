import { Router } from "express";
import User from "../models/user.model.js";

type AccessTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  token_type: string;
  scope: string;
};

type GitHubUserResponse = {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  user_view_type: string;
  site_admin: boolean;
  name: string;
  company: string;
  blog: string;
  location: string;
  email: string | null;
  hireable: boolean;
  bio: string;
  twitter_username: string;
  notification_email: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
};

export const authRouter = Router();

authRouter.get("/callback/github", async (req, res) => {
  const query = req.query;
  console.log({ query });
  const code = query.code as string;

  // Exchange the code for an access token
  const accessToken = (await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    }
  ).then((res) => res.json())) as AccessTokenResponse;

  // Use the access token to get the user's information
  const user = (await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `token ${accessToken?.access_token}`,
    },
  }).then((res) => res.json())) as GitHubUserResponse;

  console.log({ user });

  // Save the user to the database
  User.upsertGithubUser({
    email: user.email,
    firstName: user.name.split(" ")[0],
    lastName: user.name.split(" ")[1] || "",
    picture: user.avatar_url,
    verified_email: true,
  });

  res.send("ok");
});
