export class TimePoint {
  constructor(public timestamp: number, public timezone: string) {}
}

export class TimeSpan {
  constructor(public from: number, public duration: number = 0, public timezone: string) {}
}

export class ServerFile {

  constructor(
    public serverPath: string = "",
    public fileSize: number = 0,
    public mimeType: string = "*/*",
    public originalFileName: string = "") {}
}

export class LatLng {
  constructor(public latitude: number, public longitude: number) {}
}

export class Fraction {
  constructor(public upper: number, public under: number) {}
}