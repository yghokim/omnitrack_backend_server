import * as moment from 'moment';
import { Moment } from 'moment-timezone';

export function merge(objA: any, objB: any, overwrite: boolean, recursive: boolean = true): any {
  if (!objA) {
    return JSON.parse(JSON.stringify(objB))
  }

  const newObj = JSON.parse(JSON.stringify(objA))
  if (!objB) {
    return newObj
  }

  for (const bField in objB) {
    if (objB.hasOwnProperty(bField)) {
      if (objA.hasOwnProperty(bField) && overwrite === false) {
        continue;
      } else {
        if (recursive === true) {
          newObj[bField] = merge(newObj[bField], objB[bField], overwrite, true)
        } else {
          newObj[bField] = objB[bField]
        }
      }
    }
  }
  return newObj
}

export function isString(obj: any): boolean{
  return obj instanceof String || typeof(obj) === "string"
}

export function deepclone(obj: any): any {
  return JSON.parse(JSON.stringify(obj))
}

export function isNullOrEmpty(obj: string): boolean {
  return obj == null || obj.length === 0
}


export function isNullOrBlank(obj: string): boolean {
  return obj == null || obj.trim().length === 0
}

export function unique(arr: Array<any>): Array<any> {
  return arr.filter((item, i, a) => {
    return i === a.indexOf(item)
  })
}

export function diffDaysBetweenTwoMoments(a: Moment, b: Moment, includeWeekends: boolean, excludedDays?: Array<number>): number {

  if (includeWeekends) {
    const fullDiff = a.diff(b, "days")
    if (excludedDays) {
      console.log(excludedDays)
      return fullDiff - excludedDays.filter(d => {
        return d >= a.unix() && d <= b.unix()
      }).length
    } else { return fullDiff }
  } else {
    const bStart = moment(b).startOf("day")
    const aStart = moment(a).startOf("day")
    let diff = 0
    while (aStart.diff(bStart) >= 1) {
      bStart.add(1, "day")
      if (excludedDays) {
        if (excludedDays.find(d => d === bStart.unix())) {
          continue
        }
      }

      if (bStart.isoWeekday() < 6) {
        diff++
      }
    }

    if (b.isoWeekday() >= 6) {
      diff--
    }
    return diff
  }
}

export function getExtensionFromPath(path: string, delimiter: string = '.'): string {
  const split = path.split(delimiter)
  if (split.length <= 1) {
    return ""
  } else { return split[split.length - 1] }
}

interface Version { numbers: Array<number>, suffix: string }

function extractVersion(versionString: string): Version {
  const numbers = []
  const versionNumberRegex = /(\d+)[\.\-\s]?/g
  const versionSuffixRegex = /[\-\s]([a-zA-Z0-9]+)/g

  let match = null
  do {
    match = versionNumberRegex.exec(versionString)
    if (match) {
      numbers.push(parseInt(match[1]))
    }
  } while (match)

  const suffixes = versionSuffixRegex.exec(versionString)
  return { numbers: numbers, suffix: suffixes ? suffixes[1] : null }
}

export function compareVersions(versionString1: string, versionString2: string): number {
  const version1 = extractVersion(versionString1)
  const version2 = extractVersion(versionString2)

  const maxIndex = Math.max(version1.numbers.length, version2.numbers.length)
  for (let i = 0; i < maxIndex; i++) {
    const value1 = i < version1.numbers.length ? version1.numbers[i] : -1
    const value2 = i < version2.numbers.length ? version2.numbers[i] : -1

    if (value1 === value2) {
      // console.log(i + "th number compare : " + value1 + " and " + value2 + " are the same. Continue to the next numbers.")
      continue
    } else {
      return value1 > value2 ? 1 : -1
    }
  }

  // version part matches. check suffix
  if (version1.suffix && version2.suffix) {
    return version1.suffix.toLowerCase().localeCompare(version2.suffix.toLowerCase())
  } else if (!version1.suffix && version2.suffix) {
    return 1
  } else if (version1.suffix && !version2.suffix) {
    return -1
  } else { return 0 }
}

class DecodedParticipantAlias {
  prefix = ""
  code = 0
  constructor(public readonly alias: string) {
    const matches = /([a-zA-Z\#\@\$]+)[\-_]?([0-9]+)?/g.exec(alias)
    if (matches) {
      if (matches.length > 1) {
        this.prefix = matches[1]
      }

      if (matches.length > 2) {
        this.code = Number.parseInt(matches[2])
      }
    }
    if (this.prefix == null) {
      this.prefix = alias
    }
  }
}

export function aliasCompareFunc(reverse: boolean = false): (a: string, b: string) => number {
  return (a: string, b: string) => {
    const aDecoded = new DecodedParticipantAlias(a)
    const bDecoded = new DecodedParticipantAlias(b)
    let sort: number
    if (aDecoded.prefix !== bDecoded.prefix) {
      sort = aDecoded.prefix.localeCompare(bDecoded.prefix)
    } else {
      if (aDecoded.code > bDecoded.code) {
        sort = 1
      } else if (aDecoded.code < bDecoded.code) {
        sort = -1
      } else { sort = 0 }
    }

    if (reverse === true) {
      return sort * -1
    } else { return sort }
  }
}

export function groupArrayByVariable(array, variableName): any {
  const result = {}

  array.forEach(elm => {
    if (Array.isArray(elm[variableName]) === true) {
      elm[variableName].forEach(value => {
        if (result[value]) {
          result[value].push(elm)
        } else {
          result[value] = [elm]
        }
      })
    } else {
      if (result[elm[variableName]]) {
        result[elm[variableName]].push(elm)
      } else {
        result[elm[variableName]] = [elm]
      }
    }
  })
  return result
}

export function convertHashToArray<T>(hash: any, convert: (key: string, value: any) => T, ignoreNullValue: boolean): Array<T>{
  const arr = new Array<T>()

  for(const key of Object.keys(hash)){
    if(!ignoreNullValue || hash[key]){
      arr.push(convert(key, hash[key]))
    }
  }
  return arr
}

export function toDurationString(timeInSeconds: number): string {
  if (timeInSeconds === 0) {
    return "0"
  } else {
    let d = 0
    let h = 0
    let m = 0
    let s = 0

    let abs = Math.abs(timeInSeconds)
    d = Math.floor(abs / (24 * 60 * 60))
    abs -= d * 24 * 60 * 60
    h = Math.floor((abs) / (60 * 60))
    abs -= h * 60 * 60
    m = Math.floor(abs / 60)
    abs -= m * 60
    s = abs

    let result = ""

    if (d !== 0) {
      result += d + "d"
    }

    if (h !== 0) {
      result += " " + h + "h"
    }

    if (m !== 0) {
      result += " " + m + "m"
    }

    if (s !== 0) {
      result += " " + s + "s"
    }

    if (timeInSeconds > 0) {
      return result.trim()
    } else { return "before " + result.trim() }
  }
}