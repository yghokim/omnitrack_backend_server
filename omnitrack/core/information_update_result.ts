export default interface InformationUpdateResult {
  success: boolean,
  finalValue?: any,
  payloads?: Map<String, String>
}