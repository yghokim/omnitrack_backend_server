import { trigger, transition, style, animate } from "@angular/animations";

export function getTrackerColorString(tracker: any): string {
  const colorInt = tracker.color
  if (colorInt) {
    const alpha = (colorInt >> 24) & 0xFF
    const red = (colorInt >> 16) & 0xFF
    const green = (colorInt >> 8) & 0xFF
    const blue = (colorInt) & 0xFF
    return "rgba(" + red + "," + green + "," + blue + "," + (alpha / 255) + ")"
  } else { return "transparent" }
}

export function generateRowTriggerAnimation(name: string = "rowShowHideTrigger"): any{
  trigger(name || 'rowShowHideTrigger', [
    transition(':enter', [
      style({ opacity: 0, transform: "translate(0,100%)" }),
      animate('0.5s ease-out', style({ opacity: 1, transform: "translate(0,0)" })),
    ]),
    transition(':leave', [
      animate('0.3s ease-out', style({ opacity: 0, height: 0 }))
    ])
  ])
}

export function generateAlphaEnterLeaveTriggerAnim(name: string = "enterLeaveTrigger"): any{
  trigger(name || 'enterLeaveTrigger', [
    transition(':enter', [
      style({ opacity: 0 }),
      animate('0.5s ease-out', style({ opacity: 1 })),
    ]),
    transition(':leave', [
      animate('0.3s ease-out', style({ opacity: 0 }))
    ])
  ])
}