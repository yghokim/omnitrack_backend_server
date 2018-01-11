import { MAX_VALUE } from "long";

export class ExperimentModelListQuery{
  constructor(
  readonly commandName: string,
  readonly dbModel: string,
  readonly limit: number = null,
  readonly pageOffset: number = 0){}
}