import { Express } from 'express';
import * as Agenda from 'agenda';
import ServerModule from './server.module';

export default class OmniTrackModule{

  public readonly serverModule: ServerModule

  constructor(private app: any){
    this.serverModule = new ServerModule(app)
  }

  bootstrap(){
    this.serverModule.bootstrap()
  }
}
