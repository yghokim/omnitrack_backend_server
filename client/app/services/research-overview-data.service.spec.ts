import { TestBed, inject } from '@angular/core/testing';

import { ResearchOverviewDataService } from './research-overview-data.service';

describe('ResearchOverviewDataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ResearchOverviewDataService]
    });
  });

  it('should be created', inject([ResearchOverviewDataService], (service: ResearchOverviewDataService) => {
    expect(service).toBeTruthy();
  }));
});
