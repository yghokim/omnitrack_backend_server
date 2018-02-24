import { TestBed, async, inject } from '@angular/core/testing';

import { EndUserAuthToMainGuard } from './end-user-auth-to-main.guard';

describe('EndUserAuthToMainGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EndUserAuthToMainGuard]
    });
  });

  it('should ...', inject([EndUserAuthToMainGuard], (guard: EndUserAuthToMainGuard) => {
    expect(guard).toBeTruthy();
  }));
});
