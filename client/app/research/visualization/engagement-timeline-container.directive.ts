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
    
    const chartSelection = d3.select(this.elementRef.nativeElement).selectAll("rect.block-of-the-day")
      .data(this.tracker.itemBlocks, (block: ItemBlockRow)=>block.day + "_" + block.blockIndex)
    
      const chartEnter = chartSelection.enter().append("rect")
      .attr("class","block-of-the-day")
      .attr("transform", block => this.makeTranslate(this.dayScale(block.day + block.blockIndex*blockDomainSize), 0))
      .attr("height", 0)
    
      chartEnter.merge(chartSelection)
        .attr("width", this.dayScale(blockDomainSize) - this.dayScale(0))
        .attr("height", b=>this.calcHeightOfBlock(b))
        .attr("transform", block => this.makeTranslate(this.dayScale(block.day + block.blockIndex*blockDomainSize), -this.calcHeightOfBlock(block)/2))
  }

  calcHeightOfBlock(itemBlock: ItemBlockRow): number{
    return this.chartHeight * Math.min(itemBlock.items.length, this.maxItemCountThreshold)/this.maxItemCountThreshold
  }

  makeTranslate(x: number=0, y:number=0): string{
    return "translate(" + x + ", " + y + ")"
  }
}
