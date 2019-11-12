import { Directive, Output, ElementRef, EventEmitter, OnDestroy } from "@angular/core";

//https://nitayneeman.com/posts/listening-to-dom-changes-using-mutationobserver-in-angular/

@Directive({
  selector: '[domChange]'
})
export class DomChangeDirective implements OnDestroy {

  private changes: MutationObserver;

  @Output()
  public domChange = new EventEmitter();

  constructor(private elementRef: ElementRef) {
    const element = this.elementRef.nativeElement;

    this.changes = new MutationObserver((mutations: MutationRecord[]) => {
          mutations.forEach((mutation: MutationRecord) => this.domChange.emit(mutation));
        }
    );

    this.changes.observe(element, {
      attributes: true,
      childList: true,
      characterData: true
    });
  }

  ngOnDestroy(): void {
    this.changes.disconnect()
  }
}