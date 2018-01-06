import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'anonymizeEmail'
})
export class AnonymizeEmailPipe implements PipeTransform {

  transform(value: string, anonymise: string = "both", replaceString: string = "*"): string {
    const split = value.split("@")
    
    let username = split[0]
    let domain = split[1]

    let anonymiseUsername: boolean = false
    let anonymiseDomain: boolean = false
    
    switch(anonymise)
    {
      case "username":
      anonymiseUsername = true
      break;
      case "domain":
      anonymiseDomain = true
      break;
      default:
      case "both":
      anonymiseDomain = true
      anonymiseUsername = true
      break;
    }

    if(anonymiseUsername)
    {
      if(username.length == 1)
      {
        username = replaceString
      }
      else if(username.length == 2)
      {
        username = username.charAt(0) + replaceString
      }
      else{
        username = username.substr(0, 2).padEnd(username.length, replaceString)
      }
    }

    if(anonymiseDomain)
    {
      var re = /[a-zA-Z]/g; 
      const firstParts = domain.substr(0, Math.min(2, Math.max(domain.length - 3, 0)))
      domain = domain.replace(re, replaceString);
      domain = firstParts + domain.substring(firstParts.length)
    }

    return username + "@" + domain;
  }

}
