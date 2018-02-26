export class HighChartsHelper{
  static makeDefaultChartOptions(chartType: string = "column", height: any = "70%"): any{
    return {
      chart: { type: chartType, height: height },
      title: {
        text: '',
        style: {
          display: 'none'
        }
      }, 
      subtitle: {
        text: '',
        style: {
          display: 'none'
        }
      },
      colors: ['#84315d'],
      credits: { enabled: false },
    }
  }
}