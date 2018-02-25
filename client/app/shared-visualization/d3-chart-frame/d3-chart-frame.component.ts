import { Component, OnInit, Input, Output, AfterViewInit, ViewChild, ElementRef, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-d3-chart-frame',
  templateUrl: './d3-chart-frame.component.html'
})
export class D3ChartFrameComponent implements OnInit, AfterViewInit {

  @Input() title: string
  @Input() isBusy: boolean = true

  @Input() visualizationAreaHeight: number = 100

  @Output() visualizationAreaWidthChanged: EventEmitter<number> = new EventEmitter(true)

  lastVisualizationAreaWidth = null

  @ViewChild('mainContainer') mainContainer: ElementRef

  constructor() { }

  ngOnInit() {    
    const width = this.mainContainer.nativeElement.clientWidth
    if(this.lastVisualizationAreaWidth !== width)
    {
      this.lastVisualizationAreaWidth = width
      this.visualizationAreaWidthChanged.emit(width)
    }
  }

  ngAfterViewInit(){
  }

  d3ContainerSizeChanged(event){
    const width = this.mainContainer.nativeElement.clientWidth
    if(this.lastVisualizationAreaWidth !== width)
    {
      this.lastVisualizationAreaWidth = width
      this.visualizationAreaWidthChanged.emit(width)
    }
  }

}
