import { Injectable } from '@angular/core';
import { AudioCellComponent } from '../experiment-data/audio-cell/audio-cell.component';

@Injectable()
export class SingletonAudioPlayerServiceService {

  private audioElement: any;
  private audioComponent: AudioCellComponent;

  constructor() { }
  
  playAudio(audio: any, component: AudioCellComponent): boolean {
    if(this.audioComponent === undefined){
      this.audioComponent = component;//just play the audio
      return true;
    }
    else if(component === this.audioComponent){
      this.audioComponent = undefined;
      return false;
      //stop the audio, emtpy audioElement
    }
    else{
      this.audioComponent.stop()
      this.audioComponent = component;
      //somehow stop/unsubscribe timer of old component
      return true;
      
    }
  }

}
