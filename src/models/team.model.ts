import { model, Schema } from "mongoose";
import { TeamDocument, TeamModel } from "../types/team.js";
import { useGenerateSlug } from "../utils/generateSlug.js";

const { generateSlug } = useGenerateSlug();

const teamSchema = new Schema<TeamDocument, TeamModel>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "Member",
      },
    ],
    projects: [{ type: Schema.Types.ObjectId, ref: "Project" }],
  },
  { timestamps: true }
);

teamSchema.pre("save", async function (next) {
  if (!this.slug) {
    this.slug = generateSlug(this.name);
  }
  next();
});

const Team = model<TeamDocument, TeamModel>("Team", teamSchema);

export default Team;
