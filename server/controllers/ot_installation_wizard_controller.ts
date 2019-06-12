import app, { initializeFirebase, firebaseApp, clearFirebaseApp } from '../app';
import env from '../env';
import * as path from 'path';
import * as fs from 'fs-extra';
import { saveEnv } from '../env';
import { deferPromise } from '../../shared_lib/utils';


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

  isMailerSet(): boolean {
    return env != null && env["mailer"] != null && env["mailer"].api_key != null && env.mailer.sender_email != null
  }

  isCriticalConditionMet(): boolean {
    return this.isFirebaseSet() === true && this.isSuperUserSet() === true && this.isJwtSecretSet() === true && this.isMailerSet() === true
  }

  isInstallationComplete(): boolean {
    return this.isCriticalConditionMet() === true && env.installation_mode === false
  }

  setValue(newValue: any, variableName: string, install?: (value: any) => Promise<boolean>): Promise<boolean> {
    if (env[variableName] !== newValue) {
      return deferPromise(() => {
        if (install) {
          return install(newValue)
        } else return Promise.resolve(true)
      }).then(installed => {
        if (installed === true) {
          env[variableName] = newValue
          return saveEnv().then(() => true).catch(err => {
            console.error(err)
            return false
          })
        } else return false
      })
    } else { return Promise.resolve(false) }
  }

  setAndInstallMailer(mailer: any): Promise<boolean> {
    return this.setValue(mailer, "mailer", (mailerSettings: any) => {
      const mailClient = require('@sendgrid/client')
      mailClient.setApiKey(mailerSettings.api_key)
      const request = {
        method: 'GET',
        url: '/v3/mail_settings/address_whitelist'
      }
      return mailClient.request(request).then(([response, body]) => {
        if (response.statusCode === 200) {
          console.log(body)
          let modified = false

          if (body.enabled !== true) {
            body.enabled = true
            modified = true
          }

          if (body.list == null) {
            body.list = [mailerSettings.sender_email]
            modified = true
          } else {
            if (body.list.indexOf(mailerSettings.sender_email) === -1) {
              body.list.push(mailerSettings.sender_email)
              modified = true
            }
          }

          if (modified === true) {
            return mailClient.request({
              method: 'PATCH',
              url: '/v3//mail_settings/address_whitelist',
              body: body
            }).then(([response, body]) => {
              if (response.statusCode === 200) {
                console.log(body)
                return true
              } else return false
            })
          } else return true
        } else {
          return false
        }
      })
    })
  }

  setFrontendHost(address: string): Promise<boolean>{
    env.frontend_host = address
    return saveEnv().then(() => true).catch(err => {
      console.error(err)
      return false
    })
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