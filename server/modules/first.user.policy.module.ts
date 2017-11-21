import UserRoles from "../../omnitrack/core/user_roles";
import OmniTrackModule from "modules/omnitrack.module";
import * as fs from 'fs-extra';
import app from '../app'

export default class FirstUserPolicyModule{


  processOnNewUserRole(userId: string, role: string):PromiseLike<any>{
    switch(role){
      case UserRoles.SERVICE_USER:
      return this.processOnNewServiceUserRole(userId)
    }
  }

  private processOnNewServiceUserRole(userId: string): PromiseLike<any>{
    return fs.readJson("../../omnitrack/examples/example_trackers.json").then(
      pack=>{
        return app.omnitrackModule().injectPackage(userId, pack)
      }
    )
  }
}