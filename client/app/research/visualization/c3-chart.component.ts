import {
  Component,
  OnInit,
  Input,
  ChangeDetectionStrategy,
  AfterViewInit,
  ViewChild,
  ElementRef
} from "@angular/core";
import * as c3 from "c3";

@Component({
  selector: "app-c3",
  template: '<div class="c3-chart-body" #c3ChartBody></div>',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class C3ChartComponent implements OnInit, AfterViewInit {
  private chartApi: c3.ChartAPI = null;

  @ViewChild("c3ChartBody") chartContainer: ElementRef;

  private _data: any = null;
  private _options: any = null;

  @Input("options") set options(options: any) {
    if (this._options !== options) {
      this._options = options;
      this.refreshChartApi();
    }
  }

  get options(): any {
    return this._options;
  }

  @Input("data") set data(newData: any) {
    if (this._data !== newData) {
      this._data = newData;
      if (this.chartApi && this._data) {
        this.reload();
      }
    }
  }

  get data(): any {
    return this._data;
  }

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.refreshChartApi();
  }

  private refreshChartApi() {
    var options = {
      bindto: this.chartContainer.nativeElement,
      data: this.data != null ? this.data : { columns: [] }
    };

    if (this.options != null) {
      for (const optionKey of Object.keys(this.options)) {
        options[optionKey] = this.options[optionKey];
      }
    }

    this.chartApi = c3.generate(options);
  }

  private reload() {
    this.chartApi.load(this.data);
  }
}
