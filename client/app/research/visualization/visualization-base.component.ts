import { Input } from '@angular/core';

export class VisualizationBaseComponent<T>{
  @Input() data: T
}