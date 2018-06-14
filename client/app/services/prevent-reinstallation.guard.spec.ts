import { TestBed, async, inject } from '@angular/core/testing';

import { PreventReinstallationGuard } from './prevent-reinstallation.guard';

describe('PreventReinstallationGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PreventReinstallationGuard]
    });
  });

  it('should ...', inject([PreventReinstallationGuard], (guard: PreventReinstallationGuard) => {
    expect(guard).toBeTruthy();
  }));
});
