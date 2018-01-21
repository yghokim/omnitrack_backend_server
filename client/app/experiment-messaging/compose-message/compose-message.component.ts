import { Component, OnInit, OnDestroy } from '@angular/core';
import { IResearchMessage, DefaultNewMessage, MessageReceiverRules, SpecificUsersMessageReceiverRule } from '../../../../omnitrack/core/research/messaging';
import { ResearchApiService } from '../../services/research-api.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

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

  public loadedParticipants =  new BehaviorSubject<any[]>([])

  constructor(private api: ResearchApiService, private router: Router, private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    this.mountMessage(new DefaultNewMessage())
    this.mountedMessage.experiment = this.api.getSelectedExperimentId()

    this._internalSubscriptions.add(
      this.api.selectedExperimentService.flatMap(service => service.getParticipants()).subscribe(
        participants => {
          this.loadedParticipants.next(participants)
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
        if (userId instanceof String) {
          this.selectedParticipantUserIds.push(userId)
        } else if (userId instanceof Array) {
          userId.forEach(id => this.selectedParticipantUserIds.push(id))
        }
      break;
    }
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
