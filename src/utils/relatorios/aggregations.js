import { format } from 'date-fns';

export function calcularMediasHora(filteredData) {
  if (!filteredData || filteredData.length === 0) return [];

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dados = {};

  filteredData.forEach(d => {
    const date = new Date(d.datetime);
    if (isNaN(date.getTime())) {
      console.warn('Data inválida:', d.datetime);
      return;
    }

    const hour = date.getHours();

    if (!dados[hour]) dados[hour] = { temp: 0, hum: 0, count: 0 };
    dados[hour].temp += d.temperature;
    dados[hour].hum += d.humidity;
    dados[hour].count++;
  });

  return hours.map(h => {
    const horaDados = dados[h];
    const tempAvg = horaDados && horaDados.count > 0
      ? horaDados.temp / horaDados.count
      : 0;
    const humidityAvg = horaDados && horaDados.count > 0
      ? horaDados.hum / horaDados.count
      : 0;

    return {
      hour: h,
      tempAvg: parseFloat(tempAvg.toFixed(1)),
      humidityAvg: parseFloat(humidityAvg.toFixed(1)),
    };
  });
}

export function calcularMediasDiarias(filteredData) {
  if (!filteredData || filteredData.length === 0) return [];

  const diario = {};

  filteredData.forEach(d => {
    const date = new Date(d.datetime);
    if (isNaN(date.getTime())) {
      console.warn('Data inválida:', d.datetime);
      return;
    }

    const dia = format(date, 'yyyy-MM-dd');

    if (!diario[dia]) {
      diario[dia] = {
        date: date,
        tempSum: 0,
        humiditySum: 0,
        tempMin: d.temperature,
        tempMax: d.temperature,
        count: 0,
      };
    }

    const diaInfo = diario[dia];
    diaInfo.tempSum += d.temperature;
    diaInfo.humiditySum += d.humidity;
    diaInfo.tempMin = Math.min(diaInfo.tempMin, d.temperature);
    diaInfo.tempMax = Math.max(diaInfo.tempMax, d.temperature);
    diaInfo.count++;
  });

  return Object.values(diario).map(d => {
    const tempAvg = d.count > 0 ? d.tempSum / d.count : 0;
    const humidityAvg = d.count > 0 ? d.humiditySum / d.count : 0;

    return {
      date: d.date,
      dateStr: format(d.date, 'dd/MM'),
      tempAvg: parseFloat(tempAvg.toFixed(1)),
      tempMin: d.tempMin ?? 0,
      tempMax: d.tempMax ?? 0,
      humidityAvg: parseFloat(humidityAvg.toFixed(1)),
    };
  });
}

export function calcularPrimeirosDiarios(filteredData) {
  const mapa = {};

  filteredData.forEach(d => {
    const date = new Date(d.datetime);
    if (isNaN(date.getTime())) {
      console.warn('Data inválida:', d.datetime);
      return;
    }

    const chave = format(date, 'yyyy-MM-dd');

    if (!mapa[chave]) mapa[chave] = { temp: [], hum: [] };
    mapa[chave].temp.push(d.temperature);
    mapa[chave].hum.push(d.humidity);
  });

  return Object.entries(mapa).map(([dia, v]) => {
    const tempAvg = v.temp.length > 0
      ? v.temp.reduce((a, b) => a + b, 0) / v.temp.length
      : 0;
    const humAvg = v.hum.length > 0
      ? v.hum.reduce((a, b) => a + b, 0) / v.hum.length
      : 0;

    return {
      dateStr: format(new Date(dia), 'dd/MM'),
      tempAvg: parseFloat(tempAvg.toFixed(1)),
      humidityAvg: parseFloat(humAvg.toFixed(1)),
      heatIndexAvg: parseFloat((tempAvg + 0.33 * humAvg - 4).toFixed(1)),
    };
  });
}
