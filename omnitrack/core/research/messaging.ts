import { IncomingMessage } from "http";

export interface IMessageReceiverRule{
  type: string
}

export class MessageReceiverRules{
  static readonly SpecificUsersRule = "SpecificUsers"

  static fromJson(json: any): IMessageReceiverRule
  {
    switch(json.type)
    {
      case MessageReceiverRules.SpecificUsersRule:
      return new SpecificUsersMessageReceiverRule(json.userId)
    }
  }
}

export class SpecificUsersMessageReceiverRule implements IMessageReceiverRule{
  public readonly type: string = MessageReceiverRules.SpecificUsersRule
  
  constructor(public readonly userId: string | string[])
  {
  }
}