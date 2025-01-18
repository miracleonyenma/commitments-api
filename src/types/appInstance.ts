import { Document, Model } from "mongoose";

type AppInstance = {
  installationId: string;
  owner: string;
  repo: string;
};

type AppInstanceDocument = AppInstance & Document;

type AppInstanceModel = Model<AppInstanceDocument>;
// & {
//   getAppInstance(data: { installationId: string }): Promise<AppInstanceDocument>;
// };

export { AppInstance, AppInstanceDocument, AppInstanceModel };
