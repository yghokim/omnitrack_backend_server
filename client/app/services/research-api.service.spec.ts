import { TestBed, inject } from '@angular/core/testing';

import { ResearchApiService } from './research-api.service';

describe('ResearchApiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ResearchApiService]
    });
  });

  it('should be created', inject([ResearchApiService], (service: ResearchApiService) => {
    expect(service).toBeTruthy();
  }));
});
