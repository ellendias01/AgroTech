// previsão 7 dias
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import moment from 'moment';
import { Dimensions } from 'react-native';

const LinearTemperatureForecast = ({ temperatureData = [] }) => {
  const screenWidth = Dimensions.get('window').width;

  // Função segura para formatar temperaturas
  const formatTemperature = (temp) => {
    if (temp === null || temp === undefined || isNaN(temp)) {
      return 'N/A'; // ou return '0.0' se preferir mostrar zero
    }
    return parseFloat(temp).toFixed(1);
  };


  // Filtrar e preparar dados
  const prepareData = (data) => {
    if (!Array.isArray(data)) return [];
    const dadosValidos = data.filter(
      (item) =>
        item &&
        item.datetime &&
        !isNaN(new Date(item.datetime)) &&
        typeof item.temperature === 'number'&&
        !isNaN(item.temperature)

    );

    return dadosValidos.map((item) => ({
      ...item,
      timestamp: moment(item.datetime).unix(),
      datetime: moment(item.datetime).toDate(),
      dayOfYear: moment(item.datetime).dayOfYear(), // Para sazonalidade
    })).sort((a, b) => a.timestamp - b.timestamp);
  };

  const dfPeriodo = prepareData(temperatureData);

  if (dfPeriodo.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>🔮 Previsão de Temperatura</Text>
        <Text style={{ textAlign: 'center', marginTop: 20 }}>
          Nenhum dado de temperatura disponível.
        </Text>
      </View>
    );
  }

  // Regressão Linear com limites realistas
  const realisticLinearRegression = (x, y) => {
    const n = x.length;
    if (n < 2) return { slope: 0, intercept: y[0] || 20 }; // Valor padrão se poucos dados
    
    const xSum = x.reduce((a, b) => a + b, 0);
    const ySum = y.reduce((a, b) => a + b, 0);
    const xySum = x.map((xi, i) => xi * y[i]).reduce((a, b) => a + b, 0);
    const xxSum = x.map((xi) => xi * xi).reduce((a, b) => a + b, 0);

    const denom = n * xxSum - xSum * xSum;
    if (denom === 0) return { slope: 0, intercept: y[0] || 20 };

    let slope = (n * xySum - xSum * ySum) / denom;
    let intercept = (ySum - slope * xSum) / n;

    // Limitar a inclinação para evitar extrapolações extremas
    const maxSlope = 0.5; // Máximo de 0.5°C por dia de variação
    slope = Math.max(-maxSlope, Math.min(maxSlope, slope));

    return { slope, intercept };
  };

  // Calcular média móvel para suavizar variações
  const movingAverage = (data, windowSize = 3) => {
    return data.map((val, i) => {
      const start = Math.max(0, i - windowSize);
      const end = i + 1;
      const subset = data.slice(start, end);
      return subset.reduce((a, b) => a + b, 0) / subset.length;
    });
  };

  // Normalizar timestamps em dias a partir do primeiro ponto
  const baseTimestamp = dfPeriodo[0].timestamp;
  const normalizedTimestamps = dfPeriodo.map((item) => 
    (item.timestamp - baseTimestamp) / 86400
  );

  // Suavizar temperaturas com média móvel
  const rawTemperatures = dfPeriodo.map((item) => item.temperature);
  const temperatures = movingAverage(rawTemperatures);

  // Calcular regressão
  const { slope, intercept } = realisticLinearRegression(normalizedTimestamps, temperatures);

  // Previsão para os próximos 7 dias com limites realistas
  const ultimaData = moment.max(dfPeriodo.map((item) => moment(item.datetime)));
  const diasFuturos = Array.from({ length: 7 }, (_, i) =>
    moment(ultimaData).add(i + 1, 'days')
  );

  // Calcular faixa realista baseada nos dados históricos
  const minTemp = Math.min(...temperatures);
  const maxTemp = Math.max(...temperatures);
  const tempRange = maxTemp - minTemp;
  
  // Margem de segurança de 20% acima/abaixo dos extremos históricos
  const safeMin = minTemp - tempRange * 0.2;
  const safeMax = maxTemp + tempRange * 0.2;

  const temperaturasPrevistas = diasFuturos.map((dia) => {
    const timestampNormalizado = (dia.unix() - baseTimestamp) / 86400;
    let predicted = intercept + slope * timestampNormalizado;
    
    // Aplicar limites realistas
    predicted = Math.max(safeMin, Math.min(safeMax, predicted));
    
    // Ajustar para sazonalidade (simplificado)
    const dayOfYear = dia.dayOfYear();
    const similarDays = dfPeriodo.filter(d => 
      Math.abs(moment(d.datetime).dayOfYear() - dayOfYear) <= 3
    );
    
    if (similarDays.length > 0) {
      const seasonalAdjustment = similarDays.reduce(
        (sum, d) => sum + d.temperature, 0
      ) / similarDays.length;
      predicted = (predicted * 0.7 + seasonalAdjustment * 0.3); // Mistura com padrão sazonal
    }
    
    return parseFloat(predicted.toFixed(1));
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>🔮 Previsão de Temperatura (Próximos 7 dias)</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Previsão baseada em {dfPeriodo.length} pontos históricos, com ajuste sazonal.
        </Text>
        <Text style={styles.infoText}>
        Faixa realista: {formatTemperature(safeMin)}°C a {formatTemperature(safeMax)}°C
        </Text>
      </View>

      {/* Tabela */}
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.tableHeader]}>Data</Text>
          <Text style={[styles.tableCell, styles.tableHeader]}>
            Temperatura (°C)
          </Text>
        </View>
        {diasFuturos.map((dia, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableCell}>{dia.format('DD/MM/YYYY')}</Text>
            <Text style={styles.tableCell}>{temperaturasPrevistas[index]}</Text>
          </View>
        ))}
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 16,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  table: {
    margin: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  tableCell: {
    flex: 1,
    padding: 8,
    textAlign: 'center',
  },
  tableHeader: {
    fontWeight: 'bold',
    backgroundColor: '#f5f5f5',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
});

export default LinearTemperatureForecast;