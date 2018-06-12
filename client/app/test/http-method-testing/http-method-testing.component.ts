import { Component, OnInit, OnDestroy } from '@angular/core';
import { Http } from '@angular/http';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'app-http-method-testing',
  templateUrl: './http-method-testing.component.html',
  styleUrls: ['./http-method-testing.component.scss']
})
export class HttpMethodTestingComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  testMethods = ["get", "post", "put", "delete", "options"]
  private readonly urlPrefix = "api/research/debug/test_http_method/"

  response: any

  constructor(private http: Http) { }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe()
  }

  onClicked(method: string) {
    this._internalSubscriptions.add(this.http[method](this.urlPrefix + method).subscribe(
      res => {
        console.log("Test response to " + method + " method:")
        console.log(res)
        this.response = JSON.stringify(res)
      }
    ))
  }
}
