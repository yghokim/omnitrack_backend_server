import { IAndroidBuildConfig, ANDROID_PACKAGE_NAME_REGEX, IClientBuildConfigBase } from "./db-entity-types";

export function validateBuildConfig(config: IClientBuildConfigBase<any>, firebaseProjectId: string): Array<{ key: string, error?: any, message: string }> {
  switch (config.platform) {
    case "Android":
      return validateAndroidBuildConfig(config, firebaseProjectId)
  }
}

export function validateAndroidBuildConfig(config: IAndroidBuildConfig, firebaseProjectId: string): Array<{ key: string, error?: any, message: string }> {

  const errors = new Array<{ key: string, error?: any, message: string }>()

  //check android package name
  if (config.packageName == null) {
    errors.push({
      key: "packageName",
      message: "A package name is not set."
    })
  } else {
    if (ANDROID_PACKAGE_NAME_REGEX.test(config.packageName) === false) {
      errors.push({
        key: "packageName",
        message: "Not a valid package name for Android."
      })
    }
  }

  if (config.sourceCode == null) {
    errors.push({
      key: "sourceCode",
      message: "Source code is not set."
    })
  }

  if (config.credentials == null) {
    errors.push({
      key: "credentials",
      message: "Credential is not set."
    })
  } else {

    /* googleServices.json is now not manually stored by participant.
    if (config.credentials.googleServices == null) {
      errors.push({
        key: "credentials.googleServices",
        message: "Please upload a google-service.json"
      })
    } else {
      var isMalformed = false
      const json = config.credentials.googleServices
      if (json.project_info) {
        if(json.project_info.project_id !== firebaseProjectId){
          errors.push({
            key:"credentials.googleServices",
            message: "The Firebase project ID does not match with the one registered in the research server. Make sure that you generated the google-services.json file from the same Firebase project."
          })
        }
      } else isMalformed = true

      if (json.client instanceof Array) {
        let foundPackageName = false
        for (const client of json.client) {
          if (client.client_info) {
            if (client.client_info.android_client_info) {
              if (client.client_info.android_client_info.package_name === config.packageName) {
                foundPackageName = true
                break;
              }
            }
          }
        }
        if (foundPackageName === false) {
          errors.push({
            key: "credentials.googleServices",
            message: "The JSON does not contain an Android App info with the package name you entered. Check the Firebase Project dashboard whether you've added the Android App with the package name \"" + config.packageName + "\"."
          })
        }
      } else {
        isMalformed = true
      }

      if (isMalformed === true) {
        errors.push({
          key: "credentials.googleServices",
          message: "Wrong formatted JSON file. Check you uploaded the right file."
        })
      }
    }*/

    if (config.credentials.keystoreFileHash == null) {
      errors.push({
        key: "credentials.keystoreFileHash",
        message: "Please upload a keystore file."
      })
    }

    ["keystoreAlias", "keystoreKeyPassword", "keystorePassword"].forEach(
      key => {
        if (config.credentials[key] == null) {
          errors.push({
            key: "credentials." + key,
            message: "Please provide a value."
          })
        }
      }
    )

    console.log("keystoreValidated: ", config.credentials.keystoreValidated)
    if(config.credentials.keystoreValidated == null){
      errors.push({
        key:"credentials.keystoreValidated",
        message: "Verify keystore configuration before build."
      })
    }else if(config.credentials.keystoreValidated === false){
      errors.push({
        key:"credentials.keystoreValidated",
        message: "The keystore configuration must be verified."
      })
    }
  }

  return errors
}