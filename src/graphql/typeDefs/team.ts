const teamTypeDefs = `#graphql
  type Team {
    id: ID!
    name: String!
    slug: String!
    description: String
    members: [Member!]
    projects: [Project!]
    createdAt: String
    updatedAt: String
  }

  type TeamData {
    data: Team
    meta: Meta
  }

  input CreateTeamInput {
    name: String!
    description: String
  }

  input UpdateTeamInput {
    name: String
    description: String
  }

  # extend type Query {
  #   teams(pagination: Pagination): TeamData
  #   team(id: ID!): Team
  #   teamBySlug(slug: String!): Team
  # }

  # extend type Mutation {
  #   createTeam(input: CreateTeamInput!): Team!
  #   updateTeam(id: ID!, input: UpdateTeamInput!): Team!
  #   deleteTeam(id: ID!): Boolean!
  # }
`;

export default teamTypeDefs;
