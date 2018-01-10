import { ExperimentPermissions } from "../../../omnitrack/core/research/experiment";

export default interface ExperimentInfo {
  name: string
  _id: string
  manager: {alias: string, email: string, _id: string}
  experimenters: Array<{researcher: string, permissions: ExperimentPermissions}>
}