import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, zip, of } from 'rxjs';
import { PACKAGE_VERSION } from '../release_version';
import { map } from 'rxjs/operators';
import * as  moment from 'moment';
import { compareVersions } from '../../../shared_lib/utils';

interface GithubRelease{
  url: string,
  tag_name: string,
  published_at: string,
  draft: boolean
}

@Injectable()
export class PlatformVersionCheckService {
  constructor(private http: HttpClient) {

  }

  readFrontendVersion(): string{
    return PACKAGE_VERSION
  }

  readBackendVersion(): Observable<string>{
    return this.http.get("/api/version", {observe: "body", responseType: 'text'})
  }

  isVersionMatch(): Observable<boolean>{
    return this.readBackendVersion().pipe(
      map(backVer => backVer !== this.readFrontendVersion())
    )
  }

  checkNewVersion(): Observable<{needUpdate: boolean, newVersion: string}>{
    return zip(of(this.readFrontendVersion()), this.getLatestGithubReleaseTagVersion("muclipse", "omnitrack_backend_server")).pipe(
      map(result=>{
        const currentVersion = result[0]
        const newVersion = result[1]
        return {needUpdate: compareVersions(newVersion, currentVersion) > 0, newVersion: newVersion}
      })
    )
  }

  private getLatestGithubReleaseTagVersion(owner: string, repo: string): Observable<string>{
    const url = "https://api.github.com/repos/" + owner + "/" + repo + "/releases"
    return this.http.get<Array<GithubRelease>>(url, {observe: "body", responseType: "json"}).pipe(map(releases => {
      const sorted = releases.filter(r => r.draft === false).sort((a,b)=>{
        return moment(b.published_at).unix() - moment(a.published_at).unix()
      })
      if(sorted.length > 0){
        return sorted[0].tag_name
      } else{
        return null
      }
    }))
  }
}