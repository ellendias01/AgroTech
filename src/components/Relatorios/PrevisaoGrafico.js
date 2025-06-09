import React, { useState } from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import moment from 'moment';

const ForecastGrafico = ({ temperatureData = [] }) => {
  const screenWidth = Dimensions.get('window').width;
  const [tooltipPos, setTooltipPos] = useState({ visible: false, x: 0, y: 0, value: 0 });

  const formatTemperature = (temp) => (isNaN(temp) ? 'N/A' : parseFloat(temp).toFixed(1));

  const prepareData = (data) => {
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (item) =>
          item &&
          item.datetime &&
          !isNaN(new Date(item.datetime)) &&
          typeof item.temperature === 'number'
      )
      .map((item) => ({
        ...item,
        timestamp: moment(item.datetime).unix(),
        datetime: moment(item.datetime).toDate(),
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  };

  const dfPeriodo = prepareData(temperatureData);
  if (dfPeriodo.length < 4) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>🔮 Previsão de Temperatura</Text>
        <Text style={{ textAlign: 'center', marginTop: 20 }}>
          Pelo menos 4 dias de dados são necessários.
        </Text>
      </View>
    );
  }

  const baseTimestamp = dfPeriodo[0].timestamp;
  const movingAverage = (data, windowSize = 3) =>
    data.map((_, i) => {
      const slice = data.slice(Math.max(0, i - windowSize), i + 1);
      return slice.reduce((sum, t) => sum + t, 0) / slice.length;
    });

  const normalizedTimestamps = dfPeriodo.map((item) => (item.timestamp - baseTimestamp) / 86400);
  const temperatures = movingAverage(dfPeriodo.map((item) => item.temperature));

  const realisticLinearRegression = (x, y) => {
    const n = x.length;
    const xSum = x.reduce((a, b) => a + b, 0);
    const ySum = y.reduce((a, b) => a + b, 0);
    const xySum = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const xxSum = x.reduce((sum, xi) => sum + xi * xi, 0);
    const denom = n * xxSum - xSum * xSum;
    if (denom === 0) return { slope: 0, intercept: y[0] || 20 };

    let slope = (n * xySum - xSum * ySum) / denom;
    let intercept = (ySum - slope * xSum) / n;
    const maxSlope = 0.5;
    slope = Math.max(-maxSlope, Math.min(maxSlope, slope));
    return { slope, intercept };
  };

  const { slope, intercept } = realisticLinearRegression(normalizedTimestamps, temperatures);

  const realData = dfPeriodo.slice(-3);
  const realDates = realData.map((d) => moment(d.datetime));
  const realTemps = realData.map((d) => d.temperature);

  const lastDate = moment.max(realDates);
  const diasFuturos = Array.from({ length: 7 }, (_, i) => moment(lastDate).add(i + 1, 'days'));

  const tempRange = Math.max(...temperatures) - Math.min(...temperatures);
  const safeMin = Math.min(...temperatures) - tempRange * 0.2;
  const safeMax = Math.max(...temperatures) + tempRange * 0.2;

  const futurasTemperaturas = diasFuturos.map((dia) => {
    const t = (dia.unix() - baseTimestamp) / 86400;
    return Math.max(safeMin, Math.min(safeMax, intercept + slope * t));
  });

  const todosDias = [...realDates, ...diasFuturos];
  const regressaoTemperaturas = todosDias.map((dia) => {
    const t = (dia.unix() - baseTimestamp) / 86400;
    return intercept + slope * t;
  });

  const labels = todosDias.map((dia) => dia.format('DD/MM'));

  const datasets = [
    {
      data: [...realTemps, ...Array(7).fill(null)],
      color: () => '#3b82f6', // azul
      strokeWidth: 2,
    },
    {
      data: [...Array(3).fill(null), ...futurasTemperaturas],
      color: () => '#10b981', // laranja
      strokeWidth: 2,
    },
    {
      data: regressaoTemperaturas,
      color: () => '#f43f5e', // vermelho
      strokeWidth: 1,
    },
  ];

  return (
    <View style={{ marginVertical: 16 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>
        🌡️ Temperatura: Real, Previsão e Tendência
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <LineChart
          data={{ labels, datasets, legend: ['Real', 'Previsão', 'Tendência'] }}
          width={Math.max(screenWidth, labels.length * 60)}
          height={260}
          yAxisSuffix="°C"
          chartConfig={{
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            fillShadowGradientFrom: '#cce4f7',
            fillShadowGradientTo: '#66b5f2',   // cor do preenchimento (exemplo verde)
            fillShadowGradientOpacity: 0.2,  // opacidade do preenchimento
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#e5e7eb',
            },
          }}
          bezier
          onDataPointClick={({ value, x, y }) => {
            setTooltipPos({ visible: true, x, y, value });
            setTimeout(() => setTooltipPos({ ...tooltipPos, visible: false }), 2000);
          }}
          decorator={() =>
            tooltipPos.visible ? (
              <View
                style={{
                  position: 'absolute',
                  top: tooltipPos.y - 40,
                  left: tooltipPos.x - 20,
                  backgroundColor: '#1f2937',
                  padding: 6,
                  borderRadius: 6,
                }}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{tooltipPos.value.toFixed(1)}°C</Text>
              </View>
            ) : null
          }
          style={{ borderRadius: 8 }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
  },
});

export default ForecastGrafico;
