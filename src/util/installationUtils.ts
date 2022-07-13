import { v4 as uuidv4 } from "uuid";

export enum StorageKey {
  InstallationID = "installationID",
}

/**
 * Gets the installation ID of this instance
 */
export function getInstallationID(): string {
  const installationID = localStorage.getItem(StorageKey.InstallationID);
  //Just return the installation ID value if we already have one
  if (installationID) {
    return installationID;
  } else {
    //Generating a new installation ID
    const installationID = uuidv4();

    //Saving the installation ID to local storage
    localStorage.setItem(StorageKey.InstallationID, installationID);

    //Returning the installation ID
    return installationID;
  }
}
