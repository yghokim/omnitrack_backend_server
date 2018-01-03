import { IncomingMessage } from "http";

export interface IMessageReceiverRule {
  type: string
}

export class MessageReceiverRules {
  static readonly SpecificUsersRule = "SpecificUsers"

  static fromJson(json: any): IMessageReceiverRule {
    switch (json.type) {
      case MessageReceiverRules.SpecificUsersRule:
      return new SpecificUsersMessageReceiverRule(json.userId)
    }
  }
}

export class SpecificUsersMessageReceiverRule implements IMessageReceiverRule {
  public readonly type: string = MessageReceiverRules.SpecificUsersRule

  constructor(public readonly userId: string | string[] = []) {
  }

  isValid(): boolean {
    return (this.userId instanceof String && this.userId.trim().length > 0) || (this.userId instanceof Array && this.userId.length > 0)
  }
}

export interface IResearchMessage {
  label: string
  type: string
  receiverRule: IMessageReceiverRule
  from: string
  messageTitle: string
  messageBody: string
  isDraft: boolean
  reservedTime?: Date
  sentAt?: Date
  experiment?: {_id: string, name: string}
  receivers?: Array<any>
}

export class DefaultNewMessage implements IResearchMessage {
  label = ""
  type = "push"
  receiverRule: IMessageReceiverRule = new SpecificUsersMessageReceiverRule()
  from: string;
  messageTitle = ""
  messageBody = ""
  isDraft = true
  reservedTime = null
  sentAt = null
  experiment = null
  receivers = null
}

export class WrappedResearchMessage extends DefaultNewMessage {
  constructor(base: IResearchMessage) {
    super()
    this.label = base.label
    this.type = base.type
    this.receiverRule = MessageReceiverRules.fromJson(base.receiverRule)

    this.from = base.from
    this.experiment = base.experiment
    this.isDraft = base.isDraft
    this.messageTitle = base.messageTitle
    this.messageTitle = base.messageBody
    this.sentAt = base.sentAt
    this.reservedTime = base.reservedTime
    this.receivers = base.receivers
  }
}