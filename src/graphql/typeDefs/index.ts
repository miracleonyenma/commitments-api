import apiKeyTypeDefs from "./apiKey.js";
import { commitmentTypeDefs } from "./commitment.js";
import feedTypeDefs from "./feed.js";
import googleAuthTypeDefs from "./google.auth.js";
import memberTypeDefs from "./member.js";
import otpTypeDefs from "./otp.js";
import passwordResetTypeDefs from "./passwordReset.js";
import { projectTypeDefs } from "./project.js";
import roleTypeDefs from "./role.js";
import teamTypeDefs from "./team.js";
import userTypeDefs from "./user.js";

const globalTypeDefs = `#graphql
  scalar JSON

  input Pagination {
    page: Int
    limit: Int
  }

  type Meta {
    page: Int
    limit: Int
    pages: Int
    total: Int
  }
`;

const typeDefs = `
  ${globalTypeDefs}
  ${userTypeDefs}
  ${roleTypeDefs}
  ${otpTypeDefs}
  ${apiKeyTypeDefs}
  ${googleAuthTypeDefs}
  ${passwordResetTypeDefs}
  ${commitmentTypeDefs}
  ${memberTypeDefs}
  ${teamTypeDefs}
  ${projectTypeDefs}
  ${feedTypeDefs}
`;

export default typeDefs;
