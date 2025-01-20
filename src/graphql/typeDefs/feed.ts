const feedTypeDefs = `#graphql
  type Feed {
    id: ID!
    project: Project!
    type: String!
    content: String
    details: String
    metadata: FeedMetadata!
    createdAt: String
    updatedAt: String
  }

  type FeedData {
    data: [Feed!]
    meta: Meta
  }


  type FeedMetadata {
    commitments: [Commitment!]
    compareUrl: String
    branch: String
  }

  extend type Query {
    feed(projectId: ID!, pagination: Pagination, filter: FeedFilter): FeedData!
  }

  input FeedFilter {
    type: String
  }
`;

export default feedTypeDefs;
