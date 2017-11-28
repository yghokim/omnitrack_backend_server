import PushModule from "modules/push.module";
import CommandModule from "modules/command.module";
import ServerModule from "modules/server.module";
import OmniTrackModule from "modules/omnitrack.module";
import { Application } from "express-serve-static-core";

export default interface AppInterface{
  pushModule(): PushModule
  commandModule(): CommandModule
  serverModule(): ServerModule
  omnitrackModule(): OmniTrackModule
}

export class AppWrapper implements AppInterface{

  constructor(private readonly app: Application){}

  pushModule(): PushModule {
    return this.omnitrackModule().pushModule
  }
  commandModule(): CommandModule {
    return this.omnitrackModule().commandModule
  }
  serverModule(): ServerModule {
    return this.omnitrackModule().serverModule
  }
  omnitrackModule(): OmniTrackModule {
    return this.app.get("omnitrack")
  }
  
}