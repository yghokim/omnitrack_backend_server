import {
  Component,
  Input,
  Output,
  AfterViewInit,
  ViewChild,
  ElementRef,
  EventEmitter
} from "@angular/core";

@Component({
  selector: "app-d3-chart-frame",
  templateUrl: "./d3-chart-frame.component.html"
})
export class D3ChartFrameComponent implements AfterViewInit {
  @Input() title: string;
  @Input() isBusy: boolean = true;

  @Input() visualizationAreaHeight: number = 100;

  @Output() visualizationAreaWidthChanged: EventEmitter<
    number
  > = new EventEmitter(true);

  lastVisualizationAreaWidth = null;

  @ViewChild("mainContainer", { static: false }) mainContainer: ElementRef;

  constructor() {}

  ngAfterViewInit() {
    const width = this.mainContainer.nativeElement.clientWidth;
    if (this.lastVisualizationAreaWidth !== width) {
      this.lastVisualizationAreaWidth = width;
      this.visualizationAreaWidthChanged.emit(width);
    }
  }

  d3ContainerSizeChanged(event) {
    const width = this.mainContainer.nativeElement.clientWidth;
    if (this.lastVisualizationAreaWidth !== width) {
      this.lastVisualizationAreaWidth = width;
      this.visualizationAreaWidthChanged.emit(width);
    }
  }
}
