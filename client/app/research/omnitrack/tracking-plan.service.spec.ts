import { TestBed } from '@angular/core/testing';

import { TrackingPlanService } from './tracking-plan.service';

describe('TrackingPlanService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TrackingPlanService = TestBed.get(TrackingPlanService);
    expect(service).toBeTruthy();
  });
});
