import { Directive, Input, ElementRef, AfterContentInit } from '@angular/core';
import { TrackerRow, ItemBlockRow } from './engagement.component';
import * as d3 from 'd3'
import { ScaleLinear } from 'd3';

@Directive({
  selector: '[engagementTimelineContainer]'
})
export class EngagementTimelineContainerDirective implements AfterContentInit {
  private contentInitialized: boolean = false

  private _trackerRow: TrackerRow
  @Input() set tracker(trackerRow: TrackerRow)
  {
    this._trackerRow = trackerRow
    this.updateData(trackerRow)
  }

  private _dayScale: ScaleLinear<number, number>
  @Input() set dayScale(scale: ScaleLinear<number, number>)
  {
    this._dayScale = scale
    this.initializeChart()
  }

  @Input() set dayIndexRange(range: Array<number>){
    this.updateSize()
  }

  private _colorScale: ScaleLinear<d3.RGBColor, string>
  @Input() set colorScale(scale: ScaleLinear<d3.RGBColor, string>){
    this._colorScale = scale
    this.updateSize()
  }

  private _chartHeight: number = 30
  private _numBlocksPerDay: number = 4
  private _maxItemCountThreshold: number = 5

  @Input() set chartHeight(value: number){
    this._chartHeight = value
    this.updateSize()
  }

  @Input() set chartWidth(value: number){
    this.updateSize()
  }

  @Input() set numBlocksPerDay(value: number)
  {
    this._numBlocksPerDay = value
    this.updateSize()
  }

  @Input() set maxItemCountThreshold(value: number)
  {
    this._maxItemCountThreshold = value
    this.updateSize()
  }

  constructor(public elementRef: ElementRef) {
    this.initializeChart()
  }

  private initializeChart(){

  }

  private updateSize(){
    if(this.contentInitialized==true)
    {
      this.ngAfterContentInit()
    }
  }

  private updateData(trackerRow: TrackerRow){
    console.log("updated data")
  }

  ngAfterContentInit() {
    console.log("chart refresh")

    const blockDomainSize = 1 / this._numBlocksPerDay
    const blockCellWidth = () => { return this._dayScale(blockDomainSize) - this._dayScale(0) - 2 }

    const minDayIndex = this._dayScale.domain()[0]
    const maxDayIndex = this._dayScale.domain()[1] - 1

    const filteredItemBlocks = this._trackerRow.itemBlocks.filter(b => { return b.day >= minDayIndex && b.day <= maxDayIndex })

    const daySelection = d3.select(this.elementRef.nativeElement).selectAll("rect.day")
      .data(Array.from(new Array(maxDayIndex - minDayIndex + 1), (value, index) => { return index + minDayIndex }), (d:number)=>d.toString())

    const dayEnter = daySelection.enter().append("rect").attr("class", "day")
      .attr("height", this._chartHeight)
      .attr("y", -this._chartHeight / 2)
      .attr("fill", dayIndex => {
        if (filteredItemBlocks.find(b => b.day === dayIndex) != null) {
          return "#efefef"
        } else return "transparent"
      })
      .attr("rx", 3)
      .attr("ry", 3)
      .attr("x", d => (this._dayScale(d) + 1))
      .attr("width", this._dayScale(1) - this._dayScale(0) - 2)
      .attr("opacity", 0)

    dayEnter.transition().duration(500)
      .attr("opacity", 1)

    daySelection
      .transition()
      .duration(500)
      .attr("opacity", 1)
      .attr("x", d => (this._dayScale(d) + 1))
      .attr("width", this._dayScale(1) - this._dayScale(0) - 2)

    daySelection.exit().transition().duration(500)
      .attr("opacity", 0)
      .remove()

    const chartSelection = d3.select(this.elementRef.nativeElement).selectAll("g.block-of-the-day")
      .data(filteredItemBlocks, (block: ItemBlockRow) => block.day + "_" + block.blockIndex)

    const chartEnter = chartSelection.enter().append("g")
      .attr("class", "block-of-the-day")
      .attr("transform", block => this.makeTranslate(this._dayScale(block.day + block.blockIndex * blockDomainSize) + 1, 0))
     
    chartSelection
      .transition()
      .duration(500)
      .attr("transform", block => this.makeTranslate(this._dayScale(block.day + block.blockIndex * blockDomainSize) + 1, 0))

    chartEnter.append("rect").attr("class", "back")
      .attr("height", this._chartHeight)
      .attr("y", -this._chartHeight / 2)
      .attr("fill", "transparent")

    chartEnter.append("rect").attr("class", "encoded")
      .attr("height", 0)
      .attr("y", 0)
      .attr("rx", 3)
      .attr("ry", 3)
      .classed("over-threshold", block => block.items.length > this._maxItemCountThreshold)

    const merged = chartEnter.merge(chartSelection)

    merged.select("rect.back")
      .attr("width", blockCellWidth)


    merged.select("rect.encoded")
      .transition()
      .duration(300)
      .attr("width", blockCellWidth)
      .attr("height", b => this._chartHeight)
      .attr("y", block => -this._chartHeight / 2)
      .attr("fill", block => this._colorScale(block.items.length))

    chartSelection.exit().
      transition().duration(500)
      .attr("opacity", 0).remove()

    this.contentInitialized = true
  }

  calcHeightOfBlock(itemBlock: ItemBlockRow): number {
    return this._chartHeight * Math.min(itemBlock.items.length, this._maxItemCountThreshold) / this._maxItemCountThreshold
  }

  makeTranslate(x: number = 0, y: number = 0): string {
    return "translate(" + x + ", " + y + ")"
  }
}
