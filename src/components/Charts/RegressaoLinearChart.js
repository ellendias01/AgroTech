// src/components/Charts/RegressaoLinearChart.jsx
import React from 'react';
import { Line } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { round } from 'lodash';

const screenWidth = Dimensions.get('window').width;

export default function RegressaoLinearChart({ dados }) {
  if (!dados || dados.length < 2) return null;

  const times = dados.map(d => new Date(d.datetime).getTime());
  const temps = dados.map(d => d.temperature);

  const n = temps.length;
  const sumX = times.reduce((a, b) => a + b, 0);
  const sumY = temps.reduce((a, b) => a + b, 0);
  const sumXY = times.reduce((a, x, i) => a + x * temps[i], 0);
  const sumXX = times.reduce((a, x) => a + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const linhaRegressao = times.map(x => round(intercept + slope * x, 1));

  const labels = dados.map(d => {
    const data = new Date(d.datetime);
    return `${data.getDate()}/${data.getMonth() + 1}`;
  });

  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            data: temps,
            color: () => 'blue',
            strokeWidth: 2,
          },
          {
            data: linhaRegressao,
            color: () => 'red',
            strokeWidth: 2,
          },
        ],
        legend: ['Temperatura real', 'Regressão Linear'],
      }}
      width={screenWidth - 16}
      height={220}
      yAxisSuffix="°C"
      chartConfig={{
        backgroundGradientFrom: '#fff',
        backgroundGradientTo: '#fff',
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        propsForDots: {
          r: '3',
          strokeWidth: '1',
          stroke: '#333',
        },
      }}
      style={{ marginVertical: 8, borderRadius: 16 }}
    />
  );
}
