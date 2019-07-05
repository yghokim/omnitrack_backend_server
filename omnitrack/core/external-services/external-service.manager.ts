import { OTExternalService, OTServiceMeasureFactory } from './external-service';
import { FitbitService } from './services/fitbit.service';
import { AMeasureFactory } from '../value-connection/measure-factory';

class OTExternalServiceManager {

  private services: Array<OTExternalService>
  private factories: Array<OTServiceMeasureFactory>

  constructor() {
    this.services = [
      new FitbitService()
    ]

    this.factories = []
    this.services.forEach(s => {
      this.factories = this.factories.concat(s.measureFactories)
    })
  }

  get measureFactories(): Array<AMeasureFactory> {
    return this.factories
  }

  get suppoertedServices(): Array<OTExternalService> {
    return this.services
  }

  getFactoryByCode(code: string): AMeasureFactory {
    return this.factories.find(f => f.code === code)
  }
}

export const ServiceManager = new OTExternalServiceManager()