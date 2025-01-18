// src/graphql/resolvers/commitment.resolvers.ts
import Commitment from "../../models/commitment.model.js";
import { CommitmentService } from "../../services/commitment.services.js";

export const commitmentResolvers = {
  Query: {
    commitments: async (parent, args, context, info) => {
      const { page, limit, repository, priority } = args;

      const service = new CommitmentService();
      return service.getCommitments({
        page,
        limit,
        filter: { repository, priority },
      });
    },
    commitment: async (parent, args, context, info) => {
      const commitId = args.commitId;
      const service = new CommitmentService();
      return Commitment.findOne({ commitId });
    },
  },
  Mutation: {
    updateCommitment: async (parent, args, context, info) => {
      const commitId = args.commitId;
      const input = args.input;

      const service = new CommitmentService();
      return service.updateCommitment(commitId, input);
    },
  },
};
