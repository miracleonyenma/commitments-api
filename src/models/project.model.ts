import { model, Schema } from "mongoose";
import { Project, ProjectDocument, ProjectModel } from "../types/project.js";
import { useGenerateSlug } from "../utils/generateSlug.js";

const { generateSlug } = useGenerateSlug();

const projectSchema = new Schema<ProjectDocument, ProjectModel>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    repository: {
      fullName: { type: String, required: true },
      url: { type: String, required: true },
    },
    visibility: {
      type: String,
      enum: ["public", "team"],
      required: true,
      default: "public",
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: function (this: ProjectDocument) {
        return this.visibility === "team";
      },
    },
  },
  { timestamps: true }
);

projectSchema.pre("save", async function (next) {
  if (!this.slug) {
    this.slug = generateSlug(this.name);
  }
  next();
});

const Project = model<ProjectDocument, ProjectModel>("Project", projectSchema);

export default Project;
