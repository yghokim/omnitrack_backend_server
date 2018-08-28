import app, { initializeFirebase, firebaseApp, clearFirebaseApp } from '../app';
import env from '../env';
import * as path from 'path';
import * as fs from 'fs-extra';
import { saveEnv } from '../env';


const wizardKeys = ["installation_mode", "super_users", "jwt_secret", "use_mailer", "mailer"]


const FIREBASE_CERT_PATH = path.join(
  __dirname,
  "../../../../credentials/firebase-cert.json"
)

export default class OTInstallationWizardCtrl {

  isFirebaseSet(): boolean {
    return firebaseApp != null
  }

  isSuperUserSet(): boolean {
    return env != null && env["super_users"] != null && env["super_users"].length > 0
  }

  isJwtSecretSet(): boolean {
    return env != null && env["jwt_secret"] != null && env["jwt_secret"].length > 0
  }

  isCriticalConditionMet(): boolean {
    return this.isFirebaseSet() === true && this.isSuperUserSet() === true && this.isJwtSecretSet() === true
  }

  isInstallationComplete(): boolean {
    return this.isCriticalConditionMet() === true && env.installation_mode === false
  }

  setValue(newValue: any, variableName: string): Promise<boolean> {
    if (env[variableName] !== newValue) {
      env[variableName] = newValue
      return saveEnv().then(() => true).catch(err => {
        console.error(err)
        return false
      })
    } else { return Promise.resolve(false) }
  }

  setInstallationMode(modeOn: boolean): Promise<boolean> {
    if (modeOn === false) {
      if (this.isCriticalConditionMet() === true) {
        env.installation_mode = false
        return saveEnv().then(() => true).catch(err => {
          console.error(err)
          return false
        })
      } else { return Promise.resolve(false) }
    } else {
      env.installation_mode = true
      return saveEnv().then(() => true).catch(err => {
        console.error(err)
        return false
      })
    }
  }

  setFirebaseCert(cert: any): Promise<boolean> {
    return fs.writeJson(FIREBASE_CERT_PATH, cert, { spaces: 2, EOL: '\n' }).then(() => {
      initializeFirebase()
      return true
    }).catch(err => {
      console.error("firebase error")
      console.error(err)
      return false
    })
  }

  resetAll(): Promise<boolean> {
    for (const key of wizardKeys) {
      delete env[key]
    }

    return Promise.all(
      [
        fs.remove(FIREBASE_CERT_PATH).then(() => { clearFirebaseApp(); return true }).catch(err => {
          console.error(err)
          return false
        }),
        saveEnv().then(() => true).catch(err => false)
      ]
    ).then(result => {
      return result.find(r => r === false) == null
    })
  }
}

const installationWizardCtrl = new OTInstallationWizardCtrl()

export { installationWizardCtrl }