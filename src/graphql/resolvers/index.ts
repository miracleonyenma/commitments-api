import Project from "../../models/project.model.js";
import ApiKeyResolvers from "./apiKey.resolvers.js";
import { commitmentResolvers } from "./commitment.resolvers.js";
import feedResolvers from "./feed.resolvers.js";
import googleAuthResolvers from "./google.auth.resolvers.js";
import OTPResolvers from "./otp.resolvers.js";
import passwordResetResolvers from "./passwordReset.resolvers.js";
import projectResolvers from "./project.resolvers.js";
import roleResolvers from "./role.resolvers.js";
import userResolvers from "./user.resolvers.js";

const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...roleResolvers.Query,
    ...OTPResolvers.Query,
    ...ApiKeyResolvers.Query,
    ...commitmentResolvers.Query,
    ...feedResolvers.Query,
    ...projectResolvers.Query,
  },
  Project: {
    ...projectResolvers.Project,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...roleResolvers.Mutation,
    ...OTPResolvers.Mutation,
    ...ApiKeyResolvers.Mutation,
    ...googleAuthResolvers.Mutation,
    ...passwordResetResolvers.Mutation,
    ...commitmentResolvers.Mutation,
    ...projectResolvers.Mutation,
  },
};

export default resolvers;
