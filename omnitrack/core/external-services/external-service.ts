import { AMeasureFactory } from "../value-connection/measure-factory";
import { IFieldDbEntity } from "../db-entity-types";
import { TrackingPlan } from "../tracking-plan";
import { FitbitService } from "./services/fitbit.service";

export abstract class OTExternalService {

  abstract readonly name: string;
  abstract readonly description: string;

  abstract readonly identifier: string;

  abstract measureFactories: Array<OTServiceMeasureFactory>
}

export abstract class OTServiceMeasureFactory extends AMeasureFactory {

  categoryName: string = this.service.name
  code: string = this.service.identifier + "_" + this.factoryTypeName

  constructor(public readonly service: OTExternalService, factoryTypeName) {
    super(factoryTypeName)
  }

  isAttachableTo(field: IFieldDbEntity, plan: TrackingPlan): boolean { return true }
}