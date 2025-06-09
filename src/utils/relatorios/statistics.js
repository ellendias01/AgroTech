// ✅ 4. statistics.js
// 📍 src/utils/relatorios/statistics.js

import { round } from 'lodash';
import { format } from 'date-fns';
 // Cálculos estatísticos completos (memoizados)
export function calcularEstatisticas(filteredData) {
  if (!filteredData || filteredData.length === 0) return null;

  const temps = filteredData.map(d => Number (d.temperature));
  const humids = filteredData.map(d => Number( d.humidity));
  const heatIndexes = filteredData.map(d => Number (d.heatIndex));
 
 // Cálculos básicos
  const calcStats = (values) => {
    const roundedValues = values.map(v => round(v, 1)); // <- use isso

    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const sorted = [...values].sort((a, b) => a - b);

    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const median = sorted[Math.floor(sorted.length * 0.5)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];

    const freq = {};
    let maxFreq = 0;
    let modes = [];
    roundedValues.forEach(v => {
      freq[v] = (freq[v] || 0) + 1;
      if (freq[v] > maxFreq) {
        maxFreq = freq[v];
        modes = [v];
      } else if (freq[v] === maxFreq) {
        modes.push(v);
      }
    });

    const stdDev = Math.sqrt(values.reduce((sum, n) => sum + Math.pow(n - avg, 2), 0) / values.length);
    const skewness = values.reduce((sum, n) => sum + Math.pow((n - avg) / stdDev, 3), 0) / values.length;
    const kurtosis = values.reduce((sum, n) => sum + Math.pow((n - avg) / stdDev, 4), 0) / values.length - 3;
    const isNormal = Math.abs(skewness) < 0.5 && Math.abs(kurtosis) < 1;

    return {
      min: round(min, 1),
      max: round(max, 1),
      avg: round(avg, 1),
      q1: round(q1, 1),
      median: round(median, 1),
      q3: round(q3, 1),
      moda: [...new Set(modes.map(m => round(m, 1)))],
      stdDev: round(stdDev, 2),
      skewness: round(skewness, 4),
      kurtosis: round(kurtosis, 4),
      isNormal,
    };
  };

  const tempStats = calcStats(temps);
  const humidStats = calcStats(humids);
  const heatIndexAvg = round(heatIndexes.reduce((a, b) => a + b, 0) / heatIndexes.length, 1);

  const covariancia = temps.reduce((sum, temp, i) =>
    sum + (temp - tempStats.avg) * (humids[i] - humidStats.avg), 0);
  const correlacao = round(
    covariancia / (temps.length * tempStats.stdDev * humidStats.stdDev),
    4
  );

  return {
    temperatura: tempStats,
    umidade: humidStats,
    heatIndex: { avg: heatIndexAvg },
    correlacao,
    totalRecords: filteredData.length,
  };
}
