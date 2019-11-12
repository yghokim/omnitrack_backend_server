import { OTExternalService, OTServiceMeasureFactory } from '../external-service';
import TypedStringSerializer from '../../typed_string_serializer';
import attrType from '../../fields/field-types';
import { ETimeQueryGranularity } from '../..//value-connection/value-connection';


export class MisfitService extends OTExternalService {
    name = "Misfit"
    description = "Get data from the Misfit server"
    identifier = "MisfitService"
    measureFactories = [
      new MisfitStepsFactory(this),
      new MisfitSleepFactory(this)
    ]
}


class MisfitStepsFactory extends OTServiceMeasureFactory {
  dataTypeName: string = TypedStringSerializer.TYPENAME_INT
  isRangedQueryAvailable = true
  isDemandingUserInput = false
  attributeType: number = attrType.ATTR_TYPE_NUMBER
  minimumGranularity = ETimeQueryGranularity.Day
  name = "Step Count";
  description = "Get step count during a specific range";

  constructor(service: OTExternalService) {
    super(service, "step")
  }
}

class MisfitSleepFactory extends OTServiceMeasureFactory {
  dataTypeName: string = TypedStringSerializer.TYPENAME_TIMESPAN
  isRangedQueryAvailable = true
  isDemandingUserInput = false
  attributeType: number = attrType.ATTR_TYPE_TIMESPAN
  minimumGranularity = ETimeQueryGranularity.Day
  name = "Sleep Time";
  description = "Get sleep time range";

  constructor(service: OTExternalService) {
    super(service, "slp")
  }
}
