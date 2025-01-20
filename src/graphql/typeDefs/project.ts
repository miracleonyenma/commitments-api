export const projectTypeDefs = `#graphql
  type Project {
    id: ID!
    name: String!
    slug: String!
    description: String
    repository: Repository
    visibility: String
    team: Team
    createdAt: String
    updatedAt: String
  }


  type Repository {
    fullName: String!
    url: String!
    owner: String!
  }

  type ProjectData {
    data: [Project]
    meta: Meta
  }

  input CreateProjectInput {
    name: String!
    description: String
    repository: RepositoryInput
    teamId: ID
  }

  input RepositoryInput {
    fullName: String!
    url: String!
  }

  input UpdateProjectInput {
    name: String
    description: String
    repository: RepositoryInput
  }

  extend type Query {
    projects(
      visibility: String
      teamId: ID
      page: Int
      limit: Int
    ): ProjectData
    project(id: ID!): Project
    projectBySlug(slug: String!): Project
  }

  extend type Mutation {
    createProject(input: CreateProjectInput!): Project!
    updateProject(id: ID!, input: UpdateProjectInput!): Project!
    deleteProject(id: ID!): Boolean!
  }
`;
