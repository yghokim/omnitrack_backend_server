import { Input } from '@angular/core';
import { VisualizationBaseComponent } from './visualization-base.component';

export class D3VisualizationBaseComponent<T> extends VisualizationBaseComponent<T>{
  makeTranslate(x: number=0, y:number=0): string{
    return "translate(" + x + ", " + y + ")"
  }
}