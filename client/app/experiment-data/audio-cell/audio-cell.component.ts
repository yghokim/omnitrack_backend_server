import { Component, OnInit, Input, Inject, ViewChild, ElementRef } from '@angular/core';
import { ITrackerDbEntity, IAttributeDbEntity } from '../../../../omnitrack/core/db-entity-types';
import { ResearchApiService } from '../../services/research-api.service';
import { SingletonAudioPlayerServiceService } from '../../services/singleton-audio-player-service.service';
import { Subscription } from 'rxjs/Subscription';
import { BehaviorSubject} from 'rxjs/BehaviorSubject';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material';
import { Observable } from 'rxjs/Rx';
import { Pipe, PipeTransform } from '@angular/core';


@Component({
  selector: 'app-audio-cell',
  templateUrl: './audio-cell.component.html',
  styleUrls: ['./audio-cell.component.scss']
})
export class AudioCellComponent implements OnInit {

  private _internalSubscriptions = new Subscription();
  private timeSubscription: Subscription;
  private audioSource: any;
  @ViewChild('audio1')
  private audioElement: any;
  private audioDuration: number = 0;
  private currentTime = new BehaviorSubject<number>(0);
  private timer: Observable<number>;
  private isPlaying: boolean = false;

  constructor(private api: ResearchApiService, private sanitizer: DomSanitizer, private singletonService: SingletonAudioPlayerServiceService) {  }

  ngOnInit() {
    this.audioElement = this.audioElement.nativeElement;  
  }

  startTimer(){
    this.timer = Observable.timer(0,1000);
    this.timeSubscription = new Subscription();
    this.timeSubscription = this.timer.subscribe(t=> {
      this.currentTime.next(this.audioElement.currentTime); 
      if(this.audioElement.currentTime === this.audioElement.duration){
        this.stop();
      } 
    });
    this._internalSubscriptions.add(this.timeSubscription);
  }

  @Input("mediaInfo")
  set _mediaInfo(info: {trackerId: string, attributeLocalId: string, itemId: string }){
    console.log("load audio data")
    this._internalSubscriptions.add(
      this.api.getMedia(info.trackerId, info.attributeLocalId, info.itemId, "").subscribe(response => {
        this.createAudio(response);
      }, err => {
        console.log("audio data load error: " + err)
      })
    )
  }

  createAudio(audio: Blob): void {
    let reader = new FileReader();
    reader.addEventListener("load", () => {
       this.audioSource = reader.result;
    }, false);

    if (audio) {
       reader.readAsDataURL(audio);
    }
  }

  playAudio(){
   
    this.audioDuration = this.audioElement.duration; 
    let play = this.singletonService.playAudio( this.audioElement, this);
    if(play === false){
      this.stop();
    }
    else{
      this.play();
    }
  }

  stop(){
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    this.currentTime.next(0);
    this.isPlaying = false;
    this.timeSubscription.unsubscribe();
  }
  
  play(){
    this.audioElement.load();
    this.audioElement.play();
    this.startTimer();
    this.isPlaying = true;
  }

  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe();
  }

}

@Pipe({
  name: 'minuteSeconds'
})
export class MinuteSecondsPipe implements PipeTransform {

    transform(value: number): string {
       const minutes: number = Math.floor(value / 60);
       const seconds: number =  Math.round(value - minutes * 60);
       if(seconds < 10){
        return minutes + ':0' + seconds;
       }
       else return minutes + ':' + seconds;
        
    }

}