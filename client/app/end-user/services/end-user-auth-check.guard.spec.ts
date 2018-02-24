import { TestBed, async, inject } from '@angular/core/testing';

import { EndUserAuthCheckGuard } from './end-user-auth-check.guard';

describe('EndUserAuthCheckGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EndUserAuthCheckGuard]
    });
  });

  it('should ...', inject([EndUserAuthCheckGuard], (guard: EndUserAuthCheckGuard) => {
    expect(guard).toBeTruthy();
  }));
});
