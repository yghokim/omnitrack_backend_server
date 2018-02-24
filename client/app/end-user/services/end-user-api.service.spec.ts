import { TestBed, inject } from '@angular/core/testing';

import { EndUserApiService } from './end-user-api.service';

describe('EndUserApiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EndUserApiService]
    });
  });

  it('should be created', inject([EndUserApiService], (service: EndUserApiService) => {
    expect(service).toBeTruthy();
  }));
});
