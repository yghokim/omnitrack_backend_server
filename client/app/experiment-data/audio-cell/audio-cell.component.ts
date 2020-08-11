import { Component, OnInit, Input, Inject, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { ITrackerDbEntity, IFieldDbEntity } from '../../../../omnitrack/core/db-entity-types';
import { ResearchApiService } from '../../services/research-api.service';
import { SingletonAudioPlayerServiceService } from '../../services/singleton-audio-player-service.service';
import { Subscription, BehaviorSubject } from 'rxjs';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material';
import { Observable, timer } from 'rxjs';
import { Pipe, PipeTransform } from '@angular/core';
import * as FileSaver from 'file-saver';
import { filter } from 'rxjs/operators';


@Component({
  selector: 'app-audio-cell',
  templateUrl: './audio-cell.component.html',
  styleUrls: ['./audio-cell.component.scss']
})
export class AudioCellComponent implements OnInit, OnDestroy, AfterViewInit {

  public isLoadingFile = true

  public isFileError = false

  private _internalSubscriptions = new Subscription();
  private timeSubscription: Subscription;
  public audioSource: any;

  @ViewChild('audio1')
  public audioElementRef: ElementRef;

  public audioElement: any

  public audioDuration: number = 0;
  public currentTime = new BehaviorSubject<number>(0);
  private timer: Observable<number>;
  public isPlaying: boolean = false;

  private audioBlob = new BehaviorSubject<{ blob: Blob, uniqueFileName: string }>(null);

  constructor(private api: ResearchApiService, private sanitizer: DomSanitizer, private singletonService: SingletonAudioPlayerServiceService) { }

  private hasViewInit = false

  ngAfterViewInit(): void {
    this.hasViewInit = true
    this.initAudioElement()
  }

  private initAudioElement() {
    if (this.hasViewInit === true && this.audioElementRef != null) {
      this.audioElement = this.audioElementRef.nativeElement;
    }
  }

  ngOnInit() {
  }

  startTimer() {
    this.timer = timer(0, 1000);
    this.timeSubscription = new Subscription();
    this.timeSubscription = this.timer.subscribe(t => {
      this.currentTime.next(this.audioElement.currentTime);
      if (this.audioElement.currentTime === this.audioElement.duration) {
        this.stop();
      }
    });
    this._internalSubscriptions.add(this.timeSubscription);
  }

  @Input("mediaInfo")
  set _mediaInfo(info: { trackerId: string, fieldLocalId: string, itemId: string }) {
    this.isLoadingFile = true
    this.isFileError = false
    this._internalSubscriptions.add(
      this.api.getMedia(info.trackerId, info.fieldLocalId, info.itemId, "").subscribe(response => {

        this.initAudioElement()
        this.audioBlob.next({ blob: response, uniqueFileName: info.trackerId + "_" + info.itemId + "_" + info.fieldLocalId + ".wav" })
        this.createAudio(response);
        this.isFileError = false
      }, err => {
        console.log("error occurred")
        console.log(err)
        this.isFileError = true
        this.isLoadingFile = false
      }, () => {
        this.isLoadingFile = false
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

  playAudio() {

    this.audioDuration = this.audioElement.duration;
    let play = this.singletonService.playAudio(this.audioElement, this);
    if (play === false) {
      this.stop();
    }
    else {
      this.play();
    }
  }

  stop() {
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    this.currentTime.next(0);
    this.isPlaying = false;
    this.timeSubscription.unsubscribe();
  }

  play() {
    this.audioElement.load();
    this.audioElement.play();
    this.startTimer();
    this.isPlaying = true;
  }

  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe();
  }

  downloadAudio() {
    this._internalSubscriptions.add(this.audioBlob.pipe(filter(b => b != null)).subscribe(info => {
      FileSaver.saveAs(info.blob, info.uniqueFileName)
    })
    )
  }
}

@Pipe({
  name: 'minuteSeconds'
})
export class MinuteSecondsPipe implements PipeTransform {

  transform(value: number): string {
    const minutes: number = Math.floor(value / 60);
    const seconds: number = Math.round(value - minutes * 60);
    if (seconds < 10) {
      return minutes + ':0' + seconds;
    }
    else return minutes + ':' + seconds;

  }

}
