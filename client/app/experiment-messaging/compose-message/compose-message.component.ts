import { Component, OnInit } from '@angular/core';
import { IResearchMessage, DefaultNewMessage, MessageReceiverRules, SpecificUsersMessageReceiverRule } from '../../../../omnitrack/core/research/messaging';
import { ResearchApiService } from '../../services/research-api.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Component({
  selector: 'app-compose-message',
  templateUrl: './compose-message.component.html',
  styleUrls: ['./compose-message.component.scss']
})
export class ComposeMessageComponent implements OnInit {

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

  public isBusy = false

  public selectedParticipantUserIds: Array<string> = []

  public selectedDeliveryType = "now"

  public mountedMessage: IResearchMessage

  public loadedParticipants =  new BehaviorSubject<any[]>([])

  constructor(private api: ResearchApiService) { }

  ngOnInit() {
    // TODO route

    this.mountMessage(new DefaultNewMessage())
    this.loadParticipants()
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
        this.loadParticipants()
      break;
    }
  }

  private loadParticipants() {
    this.api.selectedExperimentService.flatMap(service => service.getParticipants()).subscribe(
      participants => {
        console.log(participants)
        this.loadedParticipants.next(participants)
      }
    )
  }

  public saveAsDraft() {
    this.mountedMessage.isDraft = true
  }

  public composeMessage() {
    this.mountedMessage.isDraft = false
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
