import { TestBed, inject } from '@angular/core/testing';

import { EngagementDataService } from './engagement-data.service';

describe('EngagementDataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EngagementDataService]
    });
  });

  it('should be created', inject([EngagementDataService], (service: EngagementDataService) => {
    expect(service).toBeTruthy();
  }));
});
