import { Directive, AfterContentInit, Input, ElementRef } from '@angular/core';
import { ParticipantRow } from './engagement.component';
import { ScaleLinear } from 'd3';
import * as d3 from 'd3';

@Directive({
  selector: '[engagementParticipantGroup]'
})
export class EngagementParticipantGroupDirective implements AfterContentInit {

  private _participantRow: ParticipantRow

  @Input() set participantRow(row: ParticipantRow){
    this._participantRow = row
    this.refreshChart()
  }

  private _height: number = 0
  @Input() set height(h: number){
    this._height = h
    this.refreshChart()
  }

  private _dayScale: ScaleLinear<number, number>
  @Input() set dayScale(scale: ScaleLinear<number, number>){
    this._dayScale = scale
    this.refreshChart()
  }


  @Input() set dayIndexRange(range: Array<number>){
    this.refreshChart()
  }

  private isInitializedChart = false

  constructor(private elementRef: ElementRef) { }

  refreshChart(){
    if(this.isInitializedChart === true)
    {
      this.onUpdateChart()
    }
  }

  onUpdateChart(){

    const joined = d3.select(this.elementRef.nativeElement).selectAll("rect.no-log-day")
      .data(this._participantRow.noLogDayIndices.filter(d=>{
        return d <= this._dayScale.domain()[1] && d >= this._dayScale.domain()[0]
      }), (d:number, i)=>d.toFixed(0))

    const cellWidth = this._dayScale(1) - this._dayScale(0) - 2

    const enter = joined.enter().append("rect")
      .attr("class", "no-log-day")
      .attr("fill", "url(#no-log)")
      .attr("width", cellWidth)
      .attr("height", this._height)
      .attr("x", (d)=>{return this._dayScale(d)})
      .attr("opacity", 0)

    enter.transition()
      .duration(500)
      .attr("opacity", 1)

    joined.transition()
      .duration(500)
      .attr("opacity", 1)
      .attr("width", cellWidth)
      .attr("height", this._height)
      .attr("x", (d)=>{return this._dayScale(d)})

    joined.exit().transition().duration(500)
      .attr("opacity", 0)
      .remove()
    
    this.isInitializedChart = true
  }

  ngAfterContentInit(){
    this.onUpdateChart()
  }

}
