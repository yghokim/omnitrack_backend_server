import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs';
import { PACKAGE_VERSION } from '../release_version';
import { map } from 'rxjs/operators';

@Injectable()
export class PlatformVersionCheckService {
  constructor(private http: Http) {

  }

  readFrontendVersion(): string{
    return PACKAGE_VERSION
  }

  readBackendVersion(): Observable<string>{
    return this.http.get("/api/version").pipe(
      map(res => res.text())
    )
  }

  isVersionMatch(): Observable<boolean>{
    return this.readBackendVersion().pipe(
      map(backVer => backVer !== this.readFrontendVersion())
    )
  }
}