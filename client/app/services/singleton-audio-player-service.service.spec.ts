import { TestBed, inject } from '@angular/core/testing';

import { SingletonAudioPlayerServiceService } from './singleton-audio-player-service.service';

describe('SingletonAudioPlayerServiceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SingletonAudioPlayerServiceService]
    });
  });

  it('should be created', inject([SingletonAudioPlayerServiceService], (service: SingletonAudioPlayerServiceService) => {
    expect(service).toBeTruthy();
  }));
});
