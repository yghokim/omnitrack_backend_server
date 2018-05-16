import * as ttest from 'ttest';
export function pairedTTest(sampleA: Array<any>, sampleB: Array<any>, accessor: (any) => number = null, absolute: boolean = false): TestResult {
  const a = accessor ? sampleA.map(l => accessor(l)) : sampleA
  const b = accessor ? sampleB.map(l => accessor(l)) : sampleB

  const diffs = a.map((elm, i) => {
    return absolute === true ? Math.abs(b[i] - elm) : b[i] - elm
  })

  if (diffs.length > 0) {
    const result = ttest(diffs, { mu: 0 });
    return {
      type: 'paired t',
      pValue: result.pValue(),
      df: result.freedom(),
      statistic: result.testValue()
    }
  } else { return null }
}

export function getStatisticsString(result: TestResult): string {
  if (result) {
    let resultString = ""
    switch (result.type) {
      case "paired t":
        resultString += "<i>t</i>(" + result.df + ") = " + (Math.round(result.statistic * 10000) / 10000).toFixed(4)
        break;
    }

    resultString += ", <i>p</i> = " + (Math.round(result.pValue * 10000) / 10000).toFixed(4) + getSignificanceAsterisk(result.pValue) + "."

    return resultString
  } else {
    return null
  }
}

export function getSignificanceAsterisk(pValue: number): string {
  if (pValue > 0.05) {
    return ""
  } else if (pValue > 0.01) {
    return "*"
  } else if (pValue > 0.001) {
    return "**"
  } else { return "***" }
}

export interface TestResult {
  type: string
  pValue: number
  df: number
  statistic: number
}