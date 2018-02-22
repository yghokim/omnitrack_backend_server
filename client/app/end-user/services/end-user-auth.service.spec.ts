import { TestBed, inject } from '@angular/core/testing';

import { EndUserAuthService } from './end-user-auth.service';

describe('EndUserAuthService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EndUserAuthService]
    });
  });

  it('should be created', inject([EndUserAuthService], (service: EndUserAuthService) => {
    expect(service).toBeTruthy();
  }));
});
