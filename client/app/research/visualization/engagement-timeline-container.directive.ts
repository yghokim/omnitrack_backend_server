import { Directive, Input, ElementRef, AfterContentChecked } from '@angular/core';
import { TrackerRow, ItemBlockRow } from './engagement/engagement.component';
import * as d3 from 'd3'
import { ScaleLinear } from 'd3';

@Directive({
  selector: '[engagementTimelineContainer]'
})
export class EngagementTimelineContainerDirective implements AfterContentChecked {

  @Input() tracker: TrackerRow 
  @Input() chartHeight: number
  @Input() chartWidth: number

  @Input() dayScale: ScaleLinear<number, number>
  @Input() numBlocksPerDay: number = 5
  @Input() maxItemCountThreshold: number = 5

  constructor(public elementRef: ElementRef) {
  }

  ngAfterContentChecked(){
    const blockDomainSize = 1/this.numBlocksPerDay
    const blockCellWidth = ()=>{return this.dayScale(blockDomainSize) - this.dayScale(0) - 2}

    const minDayIndex = this.dayScale.domain()[0]
    const maxDayIndex = this.dayScale.domain()[1]

    const daySelection = d3.select(this.elementRef.nativeElement).selectAll("rect.day")
      .data(Array.from(new Array(maxDayIndex-minDayIndex+1), (value, index)=>{return index+minDayIndex}))
    
    const dayEnter = daySelection.enter().append("rect").attr("class", "day")
      .attr("height", this.chartHeight)
      .attr("y", -this.chartHeight/2)
      .attr("fill", dayIndex=>{
        if(this.tracker.itemBlocks.find(b => b.day === dayIndex)!=null)
        {
          return "#eaeaea"
        }else return "transparent"
      })

    dayEnter.merge(daySelection)
      .attr("x", d => (this.dayScale(d) + 1))
      .attr("width", this.dayScale(1) - this.dayScale(0) - 2)
    
    const chartSelection = d3.select(this.elementRef.nativeElement).selectAll("g.block-of-the-day")
      .data(this.tracker.itemBlocks, (block: ItemBlockRow)=>block.day + "_" + block.blockIndex)
    
      const chartEnter = chartSelection.enter().append("g")
      .attr("class","block-of-the-day")

      chartEnter.merge(chartSelection)
        .attr("transform", block => this.makeTranslate(this.dayScale(block.day + block.blockIndex*blockDomainSize) + 1, 0))

      chartEnter.append("rect").attr("class", "back")
        .attr("height", this.chartHeight)
        .attr("y", -this.chartHeight/2)
        .attr("fill", "transparent")

      chartEnter.append("rect").attr("class", "encoded")
        .attr("height", 0)
        .attr("y", 0)
        .classed("over-threshold", block=> block.items.length > this.maxItemCountThreshold)
      
      const merged = chartEnter.merge(chartSelection)
        
      merged.select("rect.back")
        .attr("width", blockCellWidth)
        

      merged.select("rect.encoded")
        .attr("width", blockCellWidth)
        .attr("height", b=>this.calcHeightOfBlock(b))
        .attr("y", block => -this.calcHeightOfBlock(block)/2)
  }

  calcHeightOfBlock(itemBlock: ItemBlockRow): number{
    return this.chartHeight * Math.min(itemBlock.items.length, this.maxItemCountThreshold)/this.maxItemCountThreshold
  }

  makeTranslate(x: number=0, y:number=0): string{
    return "translate(" + x + ", " + y + ")"
  }
}
