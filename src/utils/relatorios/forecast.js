import { round } from 'lodash';
import { addDays, format } from 'date-fns';

  // Previsão para 7 dias (regressão linear simples)

export function gerarPrevisao(filteredData) {
  if (!filteredData || filteredData.length < 2) return [];
  filteredData.forEach((d, i) => {
    if (!d.datetime) {
      console.error(`❌ Dado inválido na posição ${i}:`, d);
      throw new Error("Campo 'datetime' está ausente nos dados.");
    }
  });



  const validData = filteredData.filter(d => d.datetime);

  const temps = validData.map(d => d.temperature);
  const times = validData.map(d => new Date(d.datetime).getTime());
  

  const n = temps.length;
  const sumX = times.reduce((a, b) => a + b, 0);
  const sumY = temps.reduce((a, b) => a + b, 0);
  const sumXY = times.reduce((a, time, i) => a + time * temps[i], 0);
  const sumXX = times.reduce((a, time) => a + time * time, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;


   // Gerar previsão para os próximos 7 dias
  const lastDate = filteredData[filteredData.length - 1].datetime;

  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(lastDate, i + 1);
    const temp = round(intercept + slope * date.getTime(), 1);
    return {
      date,
      dateStr: format(date, 'dd/MM'),
      temp,
    };
  });
}