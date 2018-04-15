import { TestBed, inject } from '@angular/core/testing';

import { ProductivitySummaryServiceService } from './productivity-summary-service.service';

describe('ProductivitySummaryServiceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductivitySummaryServiceService]
    });
  });

  it('should be created', inject([ProductivitySummaryServiceService], (service: ProductivitySummaryServiceService) => {
    expect(service).toBeTruthy();
  }));
});
