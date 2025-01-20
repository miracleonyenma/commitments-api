import { githubApp } from "../config/githubApp.js";
import Project from "../models/project.model.js";
import { ProjectDocument, Project as ProjectType } from "../types/project.js";
import Team from "../models/team.model.js";
import { CreateProjectInput, UpdateProjectInput } from "../types/project.js";
import { MemberDocument } from "../types/member.js";

export class ProjectService {
  public async createProject(
    input: CreateProjectInput,
    userId: string
  ): Promise<ProjectDocument> {
    // Validate repository access if GitHub App is installed
    // if (input.repository) {
    //   const installation =
    //     await githubApp.octokit.rest.apps.getRepoInstallation({
    //       repo: input.repository.fullName,
    //       owner: input.repository.owner,
    //     });
    //   if (!installation) {
    //     throw new Error("GitHub App must be installed on the repository");
    //   }
    // }

    // If team is specified, validate user's membership and permission
    if (input.teamId) {
      const team = await Team.findById(input.teamId).populate<{
        members: MemberDocument[];
      }>("members");
      if (!team) {
        throw new Error("Team not found");
      }

      const memberInfo = team.members.find((m) => m.user.toString() === userId);
      if (!memberInfo || !["owner", "admin"].includes(memberInfo.role)) {
        throw new Error(
          "Insufficient permissions to create project in this team"
        );
      }
    }

    const project = new Project({
      ...input,
      visibility: input.teamId ? "team" : "public",
      team: input.teamId,
    });

    await project.save();

    // If project is created for a team, update team's projects array
    if (input.teamId) {
      await Team.findByIdAndUpdate(input.teamId, {
        $push: { projects: project._id },
      });
    }

    return project;
  }

  public async updateProject(
    id: string,
    input: UpdateProjectInput,
    userId: string
  ): Promise<ProjectType> {
    const project = await Project.findById(id);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check permissions
    if (project.team) {
      const team = await Team.findById(project.team).populate<{
        members: MemberDocument[];
      }>("members");
      const memberInfo = team.members.find((m) => m.user.toString() === userId);
      if (!memberInfo || !["owner", "admin"].includes(memberInfo.role)) {
        throw new Error("Insufficient permissions to update project");
      }
    }

    Object.assign(project, input);
    await project.save();
    return project;
  }
}
