export abstract class AInvitation{
  public static readonly RandomGroupType = "RandomGroup"
  public static readonly SpecificGroupType = "SpecificGroup"

  public static fromJson(json: any): AInvitation{
    switch(json.type){
      case AInvitation.RandomGroupType: return new RandomGroupInvitation(json.groups)
      case AInvitation.SpecificGroupType: return new SpecificGroupInvitation(json.group)
    }
  }

  constructor(public type:string){}
  abstract pickGroup(): string
  toJson():any{
    const json = {type: this.type}
    this.processJson(json)
    return json
  }

  protected abstract processJson(json:any)
}

export class RandomGroupInvitation extends AInvitation{
  constructor(public groups: Array<string>){
    super(AInvitation.RandomGroupType)
  }

  pickGroup(): string {
    return this.groups[Math.floor(Math.random() * this.groups.length)]
  }

  protected processJson(json: any) {
    json.groups = this.groups
  }
}

export class SpecificGroupInvitation extends AInvitation{
  constructor(public group: string){
    super(AInvitation.SpecificGroupType)
  }

  pickGroup(): string {
    return this.group
  }

  protected processJson(json: any){
    json.group = this.group
  }
}