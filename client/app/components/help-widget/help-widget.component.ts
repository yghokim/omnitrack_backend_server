import { Component, Input, OnInit, ViewChild, ChangeDetectionStrategy, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-help-widget',
  templateUrl: './help-widget.component.html',
  styleUrls: ['./help-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpWidgetComponent implements OnInit, AfterViewInit {

  @ViewChild("elementBody") elementBody: ElementRef

  @ViewChild("tooltipContent") tooltipHtmlContent: ElementRef

  @Input() message: string

  @Input() isLightMode: boolean = false

  @Input("usePopup") _usePopup: boolean = true
  set usePopup(value: boolean){
    this._usePopup = value
    if(value===true){
      ($(this.elementBody.nativeElement) as any).tooltip()
    }
  }

  get usePopup(): boolean{
    return this._usePopup
  }

  @Input() tooltipContent: string = null

  constructor() { }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
    if(this.usePopup === true){
      ($(this.elementBody.nativeElement) as any).tooltip()
    }
  }

  getTooltipContent(): string{
    if(this.tooltipHtmlContent != null){
      return this.tooltipHtmlContent.nativeElement.innerHTML
    }else{
      return this.tooltipContent
    }
  }

}
