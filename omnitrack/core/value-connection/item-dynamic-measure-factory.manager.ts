import { AMeasureFactory } from "./measure-factory";
import { OTDataDrivenConditionMetTimeMeasureFactory, OTDataDrivenConditionMetValueMeasureFactory } from "../trigger/trigger-condition";
import { IFieldDbEntity } from "../db-entity-types";
import { TrackingPlan } from "../tracking-plan";

export class ItemDynamicMeasureFactoryManager {

  private readonly supportedMeasureFactories: Array<AMeasureFactory> = [
    new OTDataDrivenConditionMetTimeMeasureFactory(),
    new OTDataDrivenConditionMetValueMeasureFactory()
  ]

  getAttachableMeasureFactories(field: IFieldDbEntity, plan: TrackingPlan): Array<AMeasureFactory> {
    return this.supportedMeasureFactories.filter(m => m.attributeType === field.type && m.isAttachableTo(field, plan) === true)
  }

  getMeasureFactoryByCode(typeCode: String): AMeasureFactory {
    return this.supportedMeasureFactories.find(f => f.code === typeCode)
  }
}

const manager = new ItemDynamicMeasureFactoryManager()
export { manager as ItemMeasureFactoryManager }