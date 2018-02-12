import * as AndroidVersionName from 'android-versions';

export class ClientBinaryUtil{
  static getMinimumOSVersionString(packageInfo):string{
    switch(packageInfo.platform)
    {
      case "Android":
        const minSdk = AndroidVersionName.get(
          packageInfo.usesSdk.minSdkVersion)
      return "Android " + minSdk.semver + " (" + minSdk.name + ")"
    }
  }

  static getMinimumOSVersion(packageInfo):string{
    switch(packageInfo.platform)
    {
      case "Android": return packageInfo.usesSdk.minSdkVersion.toString()
    }
  }

  static getAppVersionName(packageInfo): string{
    switch(packageInfo.platform){
      case "Android":
        return packageInfo.versionName
    }
  }

  static getAppVersionCode(packageInfo): number{
    switch(packageInfo.platform){
      case "Android":
        return packageInfo.versionCode
    }
    return null
  }
}