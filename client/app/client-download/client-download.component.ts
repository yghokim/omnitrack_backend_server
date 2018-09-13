import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import * as platformDetector from 'platform';

@Component({
  selector: 'app-client-download',
  templateUrl: './client-download.component.html',
  styleUrls: ['./client-download.component.scss']
})
export class ClientDownloadComponent implements OnInit {

  private readonly internalSubscriptions = new Subscription()

  platform = "Android"

  clientBinaryPlatformList = []

  latestBinary: any

  constructor(private http: HttpClient) { }

  ngOnInit() {
    const realPlatform = platformDetector.os.family
    console.log("platform: " + realPlatform)

    this.internalSubscriptions.add(
      this.http.get("api/clients/all").subscribe(
        data => {
          this.clientBinaryPlatformList = (data as any) || []
          if (this.clientBinaryPlatformList.length > 0) {
            const platformText = realPlatform.toLowerCase().replace(/ /g, "")

            const matchedPlatform = this.clientBinaryPlatformList.find(p => p._id.toLowerCase().replace(/ /g, "").includes(platformText)) || this.clientBinaryPlatformList[0]

            if(matchedPlatform.binaries.length > 0)
            {
              this.latestBinary = matchedPlatform.binaries[0]
              this.platform = matchedPlatform._id
            }
          }
        }
      )
    )
  }

}
