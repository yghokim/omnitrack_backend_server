import { AMeasureFactory } from "./measure-factory";
import { IFieldDbEntity } from "../db-entity-types";
import { ServiceManager } from "../external-services/external-service.manager";
import { TrackingPlan } from "../tracking-plan";
import { ItemMeasureFactoryManager } from "./item-dynamic-measure-factory.manager";

export class MeasureFactoryManager {

  static getAttachableMeasureFactories(field: IFieldDbEntity, plan: TrackingPlan): Array<AMeasureFactory> {
    return ServiceManager.measureFactories.filter( f => f.attributeType === field.type).concat(ItemMeasureFactoryManager.getAttachableMeasureFactories(field, plan))
  }

  static getMeasureFactoryByCode(typeCode: string): AMeasureFactory {
    return ServiceManager.getFactoryByCode(typeCode) || ItemMeasureFactoryManager.getMeasureFactoryByCode(typeCode)
  }
}