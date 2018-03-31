import { Component, OnInit, OnDestroy } from '@angular/core';
import { IResearchMessage, DefaultNewMessage, MessageReceiverRules, SpecificUsersMessageReceiverRule } from '../../../../omnitrack/core/research/messaging';
import { ResearchApiService } from '../../services/research-api.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import * as moment from 'moment-timezone';
import { FroalaEditorModule } from 'angular-froala-wysiwyg/editor/editor.module';
import { IParticipantDbEntity } from '../../../../omnitrack/core/db-entity-types';
declare var $ :any;

@Component({
  selector: 'app-compose-message',
  templateUrl: './compose-message.component.html',
  styleUrls: ['./compose-message.component.scss']
})
export class ComposeMessageComponent implements OnInit, OnDestroy {

  public messageTypes = [{
    key: "push",
    text: "Push Notification"
  },
  {
    key: "email",
    text: "Email"
  }]

  public deliveryTypes = [
    {
      key: "now",
      text: "Send Now"
    },
    {
      key: "later",
      text: "Send Later"
    }
  ]

  public receiverRuleTypes = [
    {
      key: MessageReceiverRules.SpecificUsersRule,
      text: "Selected Participants"
    }
  ]

  private _internalSubscriptions = new Subscription()

  public isBusy = false

  public selectedParticipantUserIds: Array<string> = []

  public selectedDeliveryType = "now"

  public mountedMessage: IResearchMessage

  public participants: Array<IParticipantDbEntity>

  deliveryDate: Date = new Date()
  deliveryTime: string = "12:00"

  froalaOptions = {
    placeHolder: "Insert the email content",
    multiline: true,
    videoUpload: false,
    fileUpload: false,
    imageUpload: false,
    imagePaste: false,
    imageUploadRemoteUrls: false,
    fontFamilySelection: true,
    fontSizeSelection: true,
    fontSizeDefaultSelection: 12,
    enter: $.FroalaEditor.ENTER_BR,
    height: 300,
    heightMin: 200,
  }

  constructor(private api: ResearchApiService, private router: Router, private activatedRoute: ActivatedRoute) { }

  ngOnInit() {

    const m = moment().set({minute: 0, second: 0, millisecond: 0}).add(1, "hours")
    this.deliveryDate = m.toDate()

    this.deliveryTime = m.format("HH:00")

    this.mountMessage(new DefaultNewMessage())
    this.mountedMessage.experiment = this.api.getSelectedExperimentId()

    this._internalSubscriptions.add(
      this.api.selectedExperimentService.flatMap(service => service.getParticipants()).subscribe(
        participants => {
          this.participants = participants
        }
      )
    )
  }

  ngOnDestroy(){
    this._internalSubscriptions.unsubscribe()
  }

  private mountMessage(message: IResearchMessage) {
    this.selectedParticipantUserIds = []
    this.mountedMessage = message
    this.selectedDeliveryType = message.reservedTime ? "later" : "now"
    switch (message.receiverRule.type) {
      case MessageReceiverRules.SpecificUsersRule:
        const userId = (message.receiverRule as SpecificUsersMessageReceiverRule).userId
        if (userId instanceof Array) {
          userId.forEach(id => this.selectedParticipantUserIds.push(id))
        }else this.selectedParticipantUserIds.push(userId)
      break;
    }
  }

  onDeliveryTimeChanged(event, type){
    console.log(type)
    console.log(event)
  }

  public onSelectedReceiverRuleChanged(event) {
    switch (event.value) {
      case MessageReceiverRules.SpecificUsersRule:
        this.mountedMessage.receiverRule = new SpecificUsersMessageReceiverRule
      break;
    }
  }

  public saveAsDraft() {
    this.mountedMessage.isDraft = true
    this.enqueueMessage()
  }

  public composeMessage() {
    this.mountedMessage.isDraft = false
    this.enqueueMessage()
  }

  private enqueueMessage(){

    switch (this.mountedMessage.receiverRule.type) {
      case MessageReceiverRules.SpecificUsersRule:
      (this.mountedMessage.receiverRule as SpecificUsersMessageReceiverRule).userId = this.selectedParticipantUserIds
      break;
    }

    if(this.selectedDeliveryType == "later")
    {
      const time = moment(this.deliveryTime, "HH:mm")
      const date = moment(this.deliveryDate)
      date.set({
        hour: time.hour(),
        minute: time.minute()
      })

      this.mountedMessage.reservedTime = date.toDate()
    }

    console.log(this.mountedMessage)

    this._internalSubscriptions.add(
    this.api.selectedExperimentService.flatMap(service=>service.enqueueMessage(this.mountedMessage)).subscribe(
      success=>{
        console.log(success)
        this.router.navigate([".."], { relativeTo: this.activatedRoute })
      })
    )
  }

  public isDraftContentAvailable(): boolean {
    return this.mountedMessage != null && !this.isNullOrEmpty(this.mountedMessage.label) &&
    (!this.isNullOrEmpty(this.mountedMessage.messageBody) ||
    (this.mountedMessage.receiverRule.type === MessageReceiverRules.SpecificUsersRule && this.selectedParticipantUserIds.length > 0)
    )
  }

  public isMessageComposable(): boolean {
    return this.mountedMessage != null &&
    !this.isNullOrEmpty(this.mountedMessage.label) &&
    !this.isNullOrEmpty(this.mountedMessage.messageBody) &&
    (this.mountedMessage.receiverRule.type === MessageReceiverRules.SpecificUsersRule && this.selectedParticipantUserIds.length > 0)
  }

  private isNullOrEmpty(str: string): boolean {
    return str == null || str.trim().length === 0
  }

  onParticipantSelected(event) {
  }
}
