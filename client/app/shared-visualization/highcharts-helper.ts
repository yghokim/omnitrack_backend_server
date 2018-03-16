export class HighChartsHelper{
  static makeDefaultChartOptions(chartType: string = "column", height: any = "70%"): any{
    const chart = { 
      type: chartType, 
      height: height, 
      spacing: [10,0,0,0] }

    return {
      chart: chart,
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