import { Types } from "mongoose";
import Member from "../models/member.model.js";
import Team from "../models/team.model.js";
import { MemberDocument } from "../types/member.js";
import { TeamDocument } from "../types/team.js";

/**
 * Check if a user owns a team.
 * @param userId - The ObjectId of the user to check.
 * @returns Promise<TeamDocument> - Returns the team document if the user owns a team, null otherwise.
 */
async function userOwnsTeam(userId: string): Promise<TeamDocument | null> {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  const member = await Member.findOne({
    user: userId,
    role: "owner",
  });

  if (!member) {
    return null;
  }

  return await Team.findById(member.team);
}

export { userOwnsTeam };
