export default interface ServerUpdateData {
  id: number;
  protocolRequirement: number[];
  version: string;
  notes: string;
  remoteInstallable: boolean;
}
