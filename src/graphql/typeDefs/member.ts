const memberTypeDefs = `#graphql
  type Member {
    id: ID!
    user: User!
    role: String!
    team: Team!
    joinedAt: String
  }

  type MemberData {
    data: Member
    meta: Meta
  }

  input CreateMemberInput {
    userId: ID!
    role: String!
    teamId: ID!
  }

  input UpdateMemberInput {
    role: String
  }

  # extend type Query {
  #   members(pagination: Pagination): MemberData
  #   member(id: ID!): Member
  # }

  # extend type Mutation {
  #   createMember(input: CreateMemberInput!): Member!
  #   updateMember(id: ID!, input: UpdateMemberInput!): Member!
  #   deleteMember(id: ID!): Boolean!
  # }
`;

export default memberTypeDefs;
