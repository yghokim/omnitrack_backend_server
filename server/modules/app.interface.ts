import PushModule from "./push.module";
import CommandModule from "./command.module";
import ServerModule from "./server.module";
import OmniTrackModule from "./omnitrack.module";
import { Application } from "express-serve-static-core";
import ResearchModule from "./research.module";
import SocketModule from "./socket.module";

export default interface AppInterface {
  pushModule(): PushModule
  commandModule(): CommandModule
  serverModule(): ServerModule
  omnitrackModule(): OmniTrackModule
  researchModule(): ResearchModule
}

export class AppWrapper implements AppInterface {

  constructor(private readonly app: Application) {}

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

  researchModule(): ResearchModule {
    return this.omnitrackModule().researchModule
  }

  socketModule(): SocketModule {
    return this.omnitrackModule().socketModule
  }

}