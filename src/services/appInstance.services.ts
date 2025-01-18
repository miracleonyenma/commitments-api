import AppInstance from "../models/appInstance.model.js";
import { AppInstanceDocument, AppInstanceModel } from "../types/appInstance.js";

/**
 * Function to get app instance if it exists or create a new one if it doesn't
 * @param {Object} params - The parameters for the function
 * @param {string} params.owner - The owner of the repository
 * @param {number} params.installationId - The installation ID of the app
 * @param {string} params.repo - The repository name
 * @returns {Promise<AppInstance>} - The app instance
 */
const getAppInstance = async ({
  owner,
  installationId,
  repo,
}: {
  owner: string;
  installationId: number;
  repo: string;
}): Promise<AppInstanceDocument> => {
  const appInstance = await AppInstance.findOne({ installationId });
  if (!appInstance) {
    const newAppInstance = await AppInstance.create({
      installationId,
      owner,
      repo,
    });
    return newAppInstance;
  }
  return appInstance;
};

export { getAppInstance };
