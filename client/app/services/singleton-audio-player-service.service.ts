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
      console.log("Is undefined, just plays.");
      return true;
    }
    else if(component === this.audioComponent){
      this.audioComponent = undefined;
      console.log("Is same, should stop.");
      return false;
      //stop the audio, emtpy audioElement
    }
    else{
      this.audioComponent.stop()
      this.audioComponent.ngOnDestroy();
      this.audioComponent = component;
      console.log("Is different, should stop old one.");
      //somehow stop/unsubscribe timer of old component
      return true;
      
    }
  }

}
