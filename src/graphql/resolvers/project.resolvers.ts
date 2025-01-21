import Project from "../../models/project.model.js";
import Team from "../../models/team.model.js";
import { MemberDocument } from "../../types/member.js";
import paginateCollection from "../../utils/paginate.js";
import { checkUser } from "../../utils/user.js";

const projectResolvers = {
  Query: {
    projects: async (parent, args, context, info) => {
      const pagination = args.pagination || {};
      const filter = args.filter || {};
      const visibility = filter.visibility;
      const teamId = filter.teamId; // Check if teamId is valid
      const teamSlug = filter.teamSlug;
      const team = await Team.findOne({
        ...(teamId && { id: teamId }),
        ...(teamSlug && { slug: teamSlug }),
      }).populate<{ members: MemberDocument[] }>("members");

      if ((teamId || teamSlug) && !team) {
        throw new Error("Team not found");
      }

      const user = await checkUser(context.user.data?.id);

      // check if user is a member of the team
      if (team) {
        const member = team.members.find((m) => m.user.toString() === user.id);
        if (!member) {
          throw new Error("User is not a member of this team");
        }
      }

      const query = visibility
        ? { visibility }
        : { visibility: { $in: ["public", "team"] } };

      const projects = await paginateCollection(Project, pagination, {
        filter: query,
        populate: "team",
      });

      return projects;
    },
    project: async (parent, args, context, info) => {
      const id = args.id;
      const slug = args.slug;
      const project = await Project.findOne({
        ...(id && { id }),
        ...(slug && { slug }),
      });
      if (!project) {
        throw new Error("Project not found");
      }
      return project;
    },
    projectBySlug: async (parent, args, context, info) => {
      const slug = args.slug;
      const project = await Project.findOne({ slug });
      if (!project) {
        throw new Error("Project not found");
      }
      return project;
    },
  },
  Project: {
    team: async (parent, args, context, info) => {
      const team = await Team.findById(parent.team).populate("members");
      return team;
    },
  },
  Mutation: {
    createProject: async (parent, args, context, info) => {
      const user = checkUser(context.user.data?.id);
      if (!user) {
        throw new Error("Unauthorized");
      }
      const project = await Project.create(args.input);
      return project;
    },
    updateProject: async (parent, args, context, info) => {
      const id = args.id;
      const input = args.input;
      const user = checkUser(context.user.data?.id);
      if (!user) {
        throw new Error("Unauthorized");
      }
      const project = await Project.findByIdAndUpdate(id, input, {
        new: true,
      });
      if (!project) {
        throw new Error("Project not found");
      }
      return project;
    },
    deleteProject: async (parent, args, context, info) => {
      const id = args.id;
      const project = await Project.findByIdAndDelete(id);
      if (!project) {
        throw new Error("Project not found");
      }
      return true;
    },
  },
};

export default projectResolvers;
