 // Função para amostrar dados para performance
export const sampleData = (data, max = 100) => {
    if (data.length <= max) return data;
    const step = Math.ceil(data.length / max);
    return data.filter((_, i) => i % step === 0);
  };
  
  export const prepareChartData = (data, valueKey, color, yAxisSuffix = '') => {
    if (!data || data.length === 0) return null;
  
    const showLabel = (index) => {
      if (data.length <= 10) return true;
      return index % Math.ceil(data.length / 10) === 0;
    };
  
    return {
      labels: data.map((_, i) => (showLabel(i) ? data[i].dateStr || data[i].datetime : '')),
      datasets: [{
        data: data.map(d => d[valueKey]),
        color: (opacity = 1) => color(opacity),
        strokeWidth: 2,
      }],
      yAxisSuffix,
    };
  };
  