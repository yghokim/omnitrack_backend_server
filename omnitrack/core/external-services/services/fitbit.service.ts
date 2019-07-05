import { OTExternalService, OTServiceMeasureFactory } from '../external-service';
import TypedStringSerializer from '../../typed_string_serializer';
import attrType from '../../fields/field-types';
import { ETimeQueryGranularity } from '../..//value-connection/value-connection';

export class FitbitService extends OTExternalService {
  name: string = "Fitbit"
  description: string = "Get data from the Fitbit account"
  identifier: string = "FitbitService"
  measureFactories = [
    new FitbitStepCountMeasureFactory(this),
    new FitbitDistanceMeasureFactory(this),
    new FitbitRecentSleepMeasureFactory(this),
    new FitbitHeartRateMeasureFactory(this)
  ]
}

class FitbitStepCountMeasureFactory extends OTServiceMeasureFactory {
  dataTypeName: string = TypedStringSerializer.TYPENAME_INT
  isRangedQueryAvailable: boolean = true
  isDemandingUserInput: boolean = false
  attributeType: number = attrType.ATTR_TYPE_NUMBER
  minimumGranularity = ETimeQueryGranularity.Hour
  name: string = "Step Count";
  description: string = "Get step count during a specific range";

  constructor(service: OTExternalService) {
    super(service, "step")
  }
}

class FitbitDistanceMeasureFactory extends OTServiceMeasureFactory {
  dataTypeName: string = TypedStringSerializer.TYPENAME_FLOAT
  isRangedQueryAvailable: boolean = true
  isDemandingUserInput: boolean = false
  attributeType: number = attrType.ATTR_TYPE_NUMBER
  minimumGranularity = ETimeQueryGranularity.Minute
  name: string = "Total Distance (m)";
  description: string = "Get total distance walked during a specific range";

  constructor(service: OTExternalService) {
    super(service, "dist")
  }
}


class FitbitRecentSleepMeasureFactory extends OTServiceMeasureFactory {
  dataTypeName: string = TypedStringSerializer.TYPENAME_TIMESPAN
  isRangedQueryAvailable: boolean = true
  isDemandingUserInput: boolean = false
  attributeType: number = attrType.ATTR_TYPE_TIMESPAN
  minimumGranularity = ETimeQueryGranularity.Hour
  name: string = "Sleep Time";
  description: string = "Get sleep time range";

  constructor(service: OTExternalService) {
    super(service, "slp")
  }
}

class FitbitHeartRateMeasureFactory extends OTServiceMeasureFactory {
  dataTypeName: string = TypedStringSerializer.TYPENAME_INT
  isRangedQueryAvailable: boolean = true
  isDemandingUserInput: boolean = false
  attributeType: number = attrType.ATTR_TYPE_NUMBER
  minimumGranularity = ETimeQueryGranularity.Hour
  name: string = "Average Heart Rate";
  description: string = "Get the average heart rate during a specific range";

  constructor(service: OTExternalService) {
    super(service, "step")
  }
}