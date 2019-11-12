import { OTExternalService, OTServiceMeasureFactory } from '../external-service';
import TypedStringSerializer from '../../typed_string_serializer';
import attrType from '../../fields/field-types';
import { ETimeQueryGranularity } from '../..//value-connection/value-connection';


export class RescueTimeService extends OTExternalService {
    name = "RescueTime"
    description = "Get productivity data for personal computer usage"
    identifier = "RescueTimeService"
    measureFactories = [
      new RescueTimeProductivityScoreFactory(this),
      new RescueTimeComputerUsageDurationFactory(this)
    ]
}


class RescueTimeProductivityScoreFactory extends OTServiceMeasureFactory {
  dataTypeName: string = TypedStringSerializer.TYPENAME_DOUBLE
  isRangedQueryAvailable = true
  isDemandingUserInput = false
  attributeType: number = attrType.ATTR_TYPE_NUMBER
  minimumGranularity = ETimeQueryGranularity.Hour
  name = "Productivity Score";
  description = "Get a productivity score of computer usage";

  constructor(service: OTExternalService) {
    super(service, "prd")
  }
}

class RescueTimeComputerUsageDurationFactory extends OTServiceMeasureFactory {
  dataTypeName: string = TypedStringSerializer.TYPENAME_DOUBLE
  isRangedQueryAvailable = true
  isDemandingUserInput = false
  attributeType: number = attrType.ATTR_TYPE_NUMBER
  minimumGranularity = ETimeQueryGranularity.Hour
  name = "Computer Usage Duration";
  description = "Get a duration of the total computer usage";

  constructor(service: OTExternalService) {
    super(service, "cud")
  }
}
