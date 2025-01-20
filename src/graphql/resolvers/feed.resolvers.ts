import { FeedService } from "../../services/feed.services.js";

const feedResolvers = {
  Query: {
    feed: async (parent, args, context, info) => {
      const pagination = args.pagination || {};
      const { page, limit } = pagination;
      const filter = args.filter || {};
      const type = filter.type;

      const feedService = new FeedService();

      return await feedService.getFeedByProject(args.projectId, {
        page,
        limit,

        type,
      });
    },
  },
};

export default feedResolvers;
