import { TestBed, inject } from '@angular/core/testing';

import { ResearchVisualizationQueryConfigurationService } from './research-visualization-query-configuration.service';

describe('ResearchVisualizationQueryConfigurationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ResearchVisualizationQueryConfigurationService]
    });
  });

  it('should be created', inject([ResearchVisualizationQueryConfigurationService], (service: ResearchVisualizationQueryConfigurationService) => {
    expect(service).toBeTruthy();
  }));
});
