// ./src/github/events.ts

import { PushEvent } from "@octokit/webhooks-types";
import { githubApp } from "../config/githubApp.js";
import { getAppInstance } from "../services/appInstance.services.js";
import { CommitmentService } from "../services/commitment.services.js";
import { AnnouncementService } from "../services/announcement.services.js";
import Project from "../models/project.model.js";
import { ProjectDocument } from "../types/project.js";
import { ProjectService } from "../services/project.services.js";
import User from "../models/user.model.js";
import Team from "../models/team.model.js";
import { Types } from "mongoose";
import { TeamDocument } from "../types/team.js";
import { FeedService } from "../services/feed.services.js";
import { useGenerateSlug } from "../utils/generateSlug.js";
import Member from "../models/member.model.js";
import { userOwnsTeam } from "../utils/member.js";

const { generateSlug } = useGenerateSlug();

const setUpProject = async ({ payload }: { payload: PushEvent }) => {
  const projectService = new ProjectService();

  // if the project does not exist
  // get the owner of the repo
  const owner = payload.repository.owner;
  // check if user exists with the owner
  const user = await User.findOne({
    "gitHub.login": owner.login,
    "gitHub.id": owner.id,
  });

  // if the user does not exist, return
  if (!user) {
    throw new Error("User does not exist");
  }

  console.log({ user });

  let team: TeamDocument;

  // check if the user has a team they own
  team = await userOwnsTeam(user.id);

  if (!team) {
    const name = `{${user.firstName}}'s team`;
    const slug = generateSlug(name);

    const newTeam = await Team.create({
      slug,
      name: `${user.firstName}'s team`,
    });
    console.log({ newTeam });

    const member = await Member.create({
      user: user.id,
      role: "owner",
      team: newTeam.id,
    });

    console.log({ member });

    await newTeam.updateOne({
      $push: {
        members: member,
      },
    });

    team = newTeam;

    console.log({ team });
  }

  const projectSlug = generateSlug(payload.repository.name);

  const repositoryData = {
    fullName: payload.repository.full_name,
    url: payload.repository.html_url,
    owner: user.gitHub.id,
  };

  console.log({ repositoryData });

  const newProject = await projectService.createProject(
    {
      slug: projectSlug,
      name: payload.repository.name,
      description: payload.repository.description,
      repository: repositoryData,
      teamId: team.id,
    },
    user.id
  );

  console.log({ newProject });

  return newProject;
};

export const initEvents = () => {
  githubApp.webhooks.on("push", async (event) => {
    try {
      console.log({ event });
      const payload = event.payload as PushEvent;

      const commitmentService = new CommitmentService();
      const feedService = new FeedService();

      let project: ProjectDocument;

      // check if a project exists with this repo
      const existingProject = await Project.findOne({
        "repository.fullName": payload.repository.full_name,
      });

      console.log({ existingProject });

      project = existingProject
        ? existingProject
        : await setUpProject({ payload });

      console.log({ project });

      commitmentService.init(payload.installation.id);
      const commitments = await commitmentService.processWebhookPayload(
        payload
      );

      console.log("commitments", commitments);

      if (commitments.length === 0) throw new Error("No commitments found");

      // Generate details
      const details = await commitmentService.generateDetails({
        commitIds: commitments.map((c) => c.commitId),
      });

      console.log("details", details);

      // Generate and send announcement
      // const announcementService = new AnnouncementService();
      // const announcement = await announcementService.generateAnnouncement(
      //   commitments
      // );

      // console.log("announcement", announcement);

      if (project) {
        // Create both announcement and changelog entries
        await feedService.createFeedEntry(
          project,
          commitments,
          details,
          "announcement"
        );
        await feedService.createFeedEntry(
          project,
          commitments,
          details,
          "changelog"
        );
      }
    } catch (error) {
      console.log("🔴🔴🔴🔴🔴 ~ error:", error);
    }
  });
};
