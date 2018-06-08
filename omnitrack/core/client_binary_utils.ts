import * as AndroidVersionName from 'android-versions';
import { IPackageMetadata, OperatingSystem } from 'app-metadata';

export class ClientBinaryUtil{

  static getOsName(packageInfo: IPackageMetadata): string{
    switch(packageInfo.operatingSystem){
      case OperatingSystem.Android:
      return "Android";
      case OperatingSystem.iOS:
      return "iOS";
      case OperatingSystem.Windows:
      return "Windows"
    }
  }

  static getMinimumOSVersionString(packageInfo: IPackageMetadata):string{
    switch(packageInfo.operatingSystem)
    {
      case OperatingSystem.Android:
        const minSdk = AndroidVersionName.get(
          packageInfo.minimumOsVersion)
      return "Android " + minSdk.semver + " (" + minSdk.name + ")"
    }
  }

  static getMinimumOSVersion(packageInfo: IPackageMetadata):string{
    switch(packageInfo.operatingSystem)
    {
      case OperatingSystem.Android: return packageInfo.minimumOsVersion.toString()
    }
  }

  static getAppVersionName(packageInfo: IPackageMetadata): string{
    switch(packageInfo.operatingSystem){
      case OperatingSystem.Android:
        return packageInfo.version
    }
  }

  static getAppVersionCode(packageInfo: IPackageMetadata): number{
    switch(packageInfo.operatingSystem){
      case OperatingSystem.Android:
        return parseInt(packageInfo.buildVersion)
    }
    return null
  }
}