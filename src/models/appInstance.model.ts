import { Document, model, Model, Schema } from "mongoose";
import { AppInstanceDocument, AppInstanceModel } from "../types/appInstance.js";

const appInnstanceSchema = new Schema<AppInstanceDocument, AppInstanceModel>(
  {
    installationId: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      required: true,
    },
    repo: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// appInnstanceSchema.statics.getAppInstance = async function ({
//   installationId,
// }: {
//   installationId: string;
// }) {
//   try {
//     return this.findOne({ installationId });
//   } catch (error) {
//     throw new Error(error);
//   }
// };

const AppInstance = model<AppInstanceDocument, AppInstanceModel>(
  "AppInstance",
  appInnstanceSchema
);

export default AppInstance;
