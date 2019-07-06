import { OTExternalService, OTServiceMeasureFactory } from '../external-service';
import TypedStringSerializer from '../../typed_string_serializer';
import attrType from '../../fields/field-types';
import { ETimeQueryGranularity } from '../..//value-connection/value-connection';


export class GoogleFitService extends OTExternalService {
    name = "Google Fit"
    description = "Get data from the Google health platform"
    identifier = "GoogleFitService"
    measureFactories = [
      new GoogleFitStepsFactory(this)
    ]
}


class GoogleFitStepsFactory extends OTServiceMeasureFactory {
  dataTypeName: string = TypedStringSerializer.TYPENAME_INT
  isRangedQueryAvailable = true
  isDemandingUserInput = false
  attributeType: number = attrType.ATTR_TYPE_NUMBER
  minimumGranularity = ETimeQueryGranularity.Millis
  name = "Step Count";
  description = "Get step count during a specific range";

  constructor(service: OTExternalService) {
    super(service, "step")
  }
}
