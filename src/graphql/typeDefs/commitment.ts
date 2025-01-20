// src/graphql/typeDefs/commitment.ts
export const commitmentTypeDefs = `#graphql
  type CommitmentAuthor {
    name: String!
    email: String!
    username: String!
  }

  type CommitmentChange {
    fileName: String!
    status: String!
    patch: String
  }

  type CommitmentStats {
    additions: Int!
    deletions: Int!
    total: Int!
  }

  type CommitmentRepository {
    name: String!
    fullName: String!
    url: String!
  }

  type CommitmentChanges {
    files: [CommitmentChange!]!
    stats: CommitmentStats
  }

  type CommitmentMetadata {
    branch: String!
    compareUrl: String!
  }

  type Commitment {
    id: ID!
    commitId: String!
    title: String!
    description: String
    author: CommitmentAuthor!
    priority: String!
    impact: String!
    timestamp: String!
    repository: CommitmentRepository!
    changes: CommitmentChanges!
    channels: [String!]!
    metadata: CommitmentMetadata!
    createdAt: String!
    updatedAt: String!
  }

  type CommitmentsData {
    data: [Commitment!]
    meta: Meta
  }

  input CommitmentInput {
    title: String
    description: String
    priority: String
    impact: String
    channels: [String!]
  }

  input CommitmentFilter {
    repository: String
    priority: String
  }

  type Query {
    commitments(pagination: Pagination, filter: CommitmentFilter): CommitmentsData!
    commitment(commitId: String!): Commitment
  }

  type Mutation {
    updateCommitment(commitId: String!, input: CommitmentInput!): Commitment!
  }
`;
