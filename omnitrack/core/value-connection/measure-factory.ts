import { ETimeQueryGranularity } from "./value-connection";
import TypedStringSerializer from "../typed_string_serializer";
import attrType from '../fields/field-types';
import { IFieldDbEntity } from "../db-entity-types";
import { TrackingPlan } from "../tracking-plan";

export abstract class AMeasureFactory{
  abstract readonly code: string
  abstract readonly dataTypeName: string
  abstract readonly isRangedQueryAvailable: boolean
  abstract readonly isDemandingUserInput: boolean
  readonly minimumGranularity?: ETimeQueryGranularity = null
  abstract get categoryName(): string

  abstract get attributeType(): number

  abstract name: string
  abstract description: string

  constructor(public readonly factoryTypeName){}

  abstract isAttachableTo(field: IFieldDbEntity, plan: TrackingPlan): boolean
}

export abstract class OTItemMetadataMeasureFactory extends AMeasureFactory{

  isRangedQueryAvailable: boolean = false
  isDemandingUserInput: boolean = false
  get code(): string {
      return "itemmetadata_" + this.factoryTypeName
  }
  
  constructor(factoryTypeName: String){
    super(factoryTypeName)
  }
}

export abstract class OTTimePointMetadataMeasureFactory extends OTItemMetadataMeasureFactory{

  dataTypeName: string = TypedStringSerializer.TYPENAME_TIMEPOINT
  attributeType: number = attrType.ATTR_TYPE_TIME
}



export interface IFactoryMeasure{
  code: string
  args: any
}