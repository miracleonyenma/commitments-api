import { Router } from "express";
import User from "../models/user.model.js";
import {
  accessTokenData,
  createAccessToken,
  createRefreshToken,
} from "../utils/token.js";

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

const APP_URL = process.env.APP_URL;

export const authRouter = Router();

async function handleGithubAuth(
  code: string,
  env: {
    clientId: string;
    clientSecret: string;
  }
) {
  // Exchange the code for an access token
  const gitHubAccessToken = (await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: env.clientId,
        client_secret: env.clientSecret,
        code,
      }),
    }
  ).then((res) => res.json())) as AccessTokenResponse;

  // Use the access token to get the user's information
  const user = (await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `token ${gitHubAccessToken?.access_token}`,
    },
  }).then((res) => res.json())) as GitHubUserResponse & {
    message?: string;
    status?: string;
  };

  console.log({ user });

  if (user.status === "401") {
    throw new Error(user.message);
  }

  // Save the user to the database
  const savedUser = await User.upsertGithubUser({
    email: user.email,
    firstName: user.name.split(" ")[0],
    lastName: user.name.split(" ")[1] || "",
    picture: user.avatar_url,
    verified_email: user.email ? true : false,
    gitHub: {
      id: user.id,
      login: user.login,
    },
  });

  return {
    savedUser,
    accessToken: createAccessToken(accessTokenData(savedUser)),
    refreshToken: createRefreshToken({ id: savedUser._id }),
  };
}

// Updated route handler
authRouter.get("/callback/github", async (req, res) => {
  const code = req.query.code as string;
  const clientId = process.env.GITHUB_CLIENT_SECRET;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  try {
    const { savedUser, accessToken, refreshToken } = await handleGithubAuth(
      code,
      {
        clientId,
        clientSecret,
      }
    );

    const redirectUrl = new URL(`${APP_URL}/api/auth/github/callback`);
    redirectUrl.searchParams.set("access_token", accessToken);
    redirectUrl.searchParams.set("refresh_token", refreshToken);
    redirectUrl.searchParams.set("user_id", savedUser._id.toString());
    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("GitHub auth error:", error);
    res.redirect(`${APP_URL}/auth/error`);
  }
});

authRouter.get("/callback/github/oauth", async (req, res) => {
  const code = req.query.code as string;
  const clientId = process.env.GITHUB_OUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OUTH_CLIENT_SECRET;

  try {
    const { savedUser, accessToken, refreshToken } = await handleGithubAuth(
      code,
      {
        clientId,
        clientSecret,
      }
    );

    const redirectUrl = new URL(`${APP_URL}/api/auth/github/callback`);
    redirectUrl.searchParams.set("access_token", accessToken);
    redirectUrl.searchParams.set("refresh_token", refreshToken);
    redirectUrl.searchParams.set("user_id", savedUser._id.toString());
    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("GitHub auth error:", error);
    res.redirect(`${APP_URL}/auth/error`);
  }
});
