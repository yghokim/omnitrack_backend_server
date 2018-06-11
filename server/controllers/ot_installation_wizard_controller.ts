import app from '../app';
import env from '../env';
import { saveEnv } from '../env';
import * as firebaseAdmin from 'firebase-admin';

export default class OTInstallationWizardCtrl{

  isSuperUserSet(): boolean{
    return env && env["super_users"] && env["super_users"].length > 0
  }

  isJwtSecretSet(): boolean{
    return env && env["jwt_secret"] && env["jwt_secret"].length > 0
  }

  isCriticalConditionMet(): boolean{
    return firebaseAdmin.apps.length > 0 && this.isSuperUserSet() === true && this.isJwtSecretSet()
  }

  isInstallationComplete(): boolean{
    return this.isCriticalConditionMet() === true && env.installation_mode === true
  }

  setInstallationMode(modeOn: boolean): Promise<boolean>{
    if(modeOn===true){
      if(this.isCriticalConditionMet() === true){
        env.installation_mode = true
        return saveEnv().then(()=>true).catch(err=>false)
      }
      else return Promise.resolve(false)
    }else{
      env.installation_mode = false
      return saveEnv().then(()=>true).catch(err => false)
    }
  }  
}

const installationWizardCtrl = new OTInstallationWizardCtrl()

export { installationWizardCtrl }