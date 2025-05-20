import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  Dimensions,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import Papa from 'papaparse';
import { parseISO, format, isAfter, isBefore, addDays } from 'date-fns';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import * as Print from 'expo-print';
import { round } from 'lodash';
import { Svg, Circle, Line, Text as SvgText } from 'react-native-svg';



const screenWidth = Dimensions.get('window').width;
const MAX_DATA_POINTS = 1000;

const Relatorios = () => {
  // Estados principais
  const [rawData, setRawData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [layoutReady, setLayoutReady] = useState(false);
  const viewRef = useRef(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Configurações dos gráficos
  const chartConfigs = {
    temp: {
      backgroundColor: '#fff',
      backgroundGradientFrom: '#fefefe',
      backgroundGradientTo: '#fefefe',
      decimalPlaces: 1,
      color: (opacity = 1) => `rgba(255, 87, 51, ${opacity})`, // Laranja
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      propsForDots: {
        r: '4',
        strokeWidth: '2',
        stroke: '#ff5722',
      },
      fillShadowGradient: '#ff7043',
      fillShadowGradientOpacity: 0.3,
    },
    humidity: {
      backgroundColor: '#fff',
      backgroundGradientFrom: '#fefefe',
      backgroundGradientTo: '#fefefe',
      decimalPlaces: 1,
      color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // Azul
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      propsForDots: {
        r: '4',
        strokeWidth: '2',
        stroke: '#2196f3',
      },
      fillShadowGradient: '#64b5f6',
      fillShadowGradientOpacity: 0.3,
    },
    heatIndex: {
      backgroundColor: '#fff',
      backgroundGradientFrom: '#fefefe',
      backgroundGradientTo: '#fefefe',
      decimalPlaces: 1,
      color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`, // Roxo
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      propsForDots: {
        r: '4',
        strokeWidth: '2',
        stroke: '#9c27b0',
      },
      fillShadowGradient: '#ba68c8',
      fillShadowGradientOpacity: 0.3,
    },
    correlation: {
      backgroundColor: '#fff',
      backgroundGradientFrom: '#fefefe',
      backgroundGradientTo: '#fefefe',
      decimalPlaces: 1,
      color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Verde
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      fillShadowGradient: '#81c784',
      fillShadowGradientOpacity: 0.3,
    }
  };
  // Função para amostrar dados para performance
  const sampleData = (data, max = 100) => {
    if (data.length <= max) return data;
    const step = Math.ceil(data.length / max);
    return data.filter((_, i) => i % step === 0);
  };

  // Função para carregar e parsear CSV
  const handleFileUpload = async () => {
    try {
      setIsLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        setIsLoading(false);
        return;
      }

      const file = result.assets[0];
      const csvContent = await FileSystem.readAsStringAsync(file.uri);

      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedData = results.data
            .slice(0, MAX_DATA_POINTS)
            .map((row) => ({
              datetime: parseISO(row.datetime),
              temperature: parseFloat(row.temperature),
              humidity: parseFloat(row.humidity),
              heatIndex: parseFloat((parseFloat(row.temperature) + 0.33 * parseFloat(row.humidity) - 4).toFixed(2)),
            }))
            .filter((d) => !isNaN(d.datetime.getTime()) && !isNaN(d.temperature) && !isNaN(d.humidity))
            .sort((a, b) => a.datetime - b.datetime);

          setRawData(parsedData);
          if (parsedData.length > 0) {
            setStartDate(format(parsedData[0].datetime, 'yyyy-MM-dd'));
            setEndDate(format(parsedData[parsedData.length - 1].datetime, 'yyyy-MM-dd'));
          }
          setIsLoading(false);
        },
        error: (error) => {
          Alert.alert('Erro', 'Falha ao processar CSV: ' + error.message);
          setIsLoading(false);
        }
      });
    } catch (error) {
      Alert.alert('Erro', error.message);
      setIsLoading(false);
    }
  };

    
  // Função que filtra dados baseado no intervalo de datas
  useEffect(() => {
    if (!startDate || !endDate || rawData.length === 0) {
      setFilteredData(rawData);
      return;
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    const filtered = rawData.filter((d) => {
      return (isAfter(d.datetime, start) || d.datetime.getTime() === start.getTime()) &&
        (isBefore(d.datetime, end) || d.datetime.getTime() === end.getTime());
    });

    setFilteredData(filtered);
  }, [rawData, startDate, endDate]);

  // Cálculos estatísticos completos (memoizados)
  const estatisticasCompletas = useMemo(() => {
    if (filteredData.length === 0) return null;

    const temps = filteredData.map(d => d.temperature);
    const humids = filteredData.map(d => d.humidity);
    const heatIndexes = filteredData.map(d => d.heatIndex);

    // Cálculos básicos
    const tempMin = Math.min(...temps);
    const tempMax = Math.max(...temps);
    const tempAvg = temps.reduce((a, b) => a + b, 0) / temps.length;

    const humidMin = Math.min(...humids);
    const humidMax = Math.max(...humids);
    const humidAvg = humids.reduce((a, b) => a + b, 0) / humids.length;

    const heatIndexAvg = heatIndexes.reduce((a, b) => a + b, 0) / heatIndexes.length;

    // Cálculos avançados
    const sortedTemps = [...temps].sort((a, b) => a - b);
    const sortedHumids = [...humids].sort((a, b) => a - b);

    // Quartis
    const q1Temp = sortedTemps[Math.floor(sortedTemps.length * 0.25)];
    const medianTemp = sortedTemps[Math.floor(sortedTemps.length * 0.5)];
    const q3Temp = sortedTemps[Math.floor(sortedTemps.length * 0.75)];

    const q1Humid = sortedHumids[Math.floor(sortedHumids.length * 0.25)];
    const medianHumid = sortedHumids[Math.floor(sortedHumids.length * 0.5)];
    const q3Humid = sortedHumids[Math.floor(sortedHumids.length * 0.75)];

    // Moda
    // Moda (pegando apenas o primeiro valor mais frequente)
    const tempFrequency = {};
    let tempMaxFreq = 0;
    let tempModes = [];
    temps.forEach(t => {
      tempFrequency[t] = (tempFrequency[t] || 0) + 1;
      if (tempFrequency[t] > tempMaxFreq) {
        tempMaxFreq = tempFrequency[t];
        tempModes = [t];
      } else if (tempFrequency[t] === tempMaxFreq) {
        tempModes.push(t);
      }

    });

    const humidFrequency = {};
    let humidMaxFreq = 0;
    let humidModes = [];
    humids.forEach(h => {
      humidFrequency[h] = (humidFrequency[h] || 0) + 1;
      if (humidFrequency[h] > humidMaxFreq) {
        humidMaxFreq = humidFrequency[h];
        humidModes = [h];
      } else if (humidFrequency[h] === humidMaxFreq) {
        humidModes.push(h);
      }

    });
    // Desvio padrão
    const tempStdDev = Math.sqrt(temps.reduce((sq, n) => sq + Math.pow(n - tempAvg, 2), 0) / temps.length);
    const humidStdDev = Math.sqrt(humids.reduce((sq, n) => sq + Math.pow(n - humidAvg, 2), 0) / humids.length);

    // Assimetria (skewness)
    const tempSkewness = temps.reduce((skew, n) => skew + Math.pow((n - tempAvg) / tempStdDev, 3), 0) / temps.length;
    const humidSkewness = humids.reduce((skew, n) => skew + Math.pow((n - humidAvg) / humidStdDev, 3), 0) / humids.length;

    // Curtose
    const tempKurtosis = temps.reduce((kurt, n) => kurt + Math.pow((n - tempAvg) / tempStdDev, 4), 0) / temps.length - 3;
    const humidKurtosis = humids.reduce((kurt, n) => kurt + Math.pow((n - humidAvg) / humidStdDev, 4), 0) / humids.length - 3;

    // Correlação entre temperatura e umidade
    const covariancia = temps.reduce((sum, temp, i) =>
      sum + (temp - tempAvg) * (humids[i] - humidAvg), 0);
    const correlacao = covariancia / (temps.length * tempStdDev * humidStdDev);

    // Teste de normalidade simplificado
    const isTempNormal = Math.abs(tempSkewness) < 0.5 && Math.abs(tempKurtosis) < 1;
    const isHumidNormal = Math.abs(humidSkewness) < 0.5 && Math.abs(humidKurtosis) < 1;

    return {
      temperatura: {
        min: round(tempMin, 1),
        max: round(tempMax, 1),
        avg: round(tempAvg, 1),
        q1: round(q1Temp, 1),
        median: round(medianTemp, 1),
        q3: round(q3Temp, 1),
        moda: tempModes.map(m => round(m, 1)),
        stdDev: round(tempStdDev, 2),
        skewness: round(tempSkewness, 4),
        kurtosis: round(tempKurtosis, 4),
        isNormal: isTempNormal,
      },
      umidade: {
        min: round(humidMin, 1),
        max: round(humidMax, 1),
        avg: round(humidAvg, 1),
        q1: round(q1Humid, 1),
        median: round(medianHumid, 1),
        q3: round(q3Humid, 1),
        moda: humidModes.map(m => round(m, 1)),
        stdDev: round(humidStdDev, 2),
        skewness: round(humidSkewness, 4),
        kurtosis: round(humidKurtosis, 4),
        isNormal: isHumidNormal,
      },
      heatIndex: {
        avg: round(heatIndexAvg, 1),
      },
      correlacao: round(correlacao, 4),
      totalRecords: filteredData.length,
    };
  }, [filteredData]);

  // Classificação de temperaturas (memoizada)
  const tempClassificationData = useMemo(() => {
    if (filteredData.length === 0) return [];

    const cold = filteredData.filter(d => d.temperature < 15).length;
    const pleasant = filteredData.filter(d => d.temperature >= 15 && d.temperature < 25).length;
    const hot = filteredData.filter(d => d.temperature >= 25).length;

    return [
      { name: "Frio", population: cold, color: "lightblue", legendFontColor: "#7F7F7F", legendFontSize: 15 },
      { name: "Agradável", population: pleasant, color: "lightgreen", legendFontColor: "#7F7F7F", legendFontSize: 15 },
      { name: "Quente", population: hot, color: "salmon", legendFontColor: "#7F7F7F", legendFontSize: 15 },
    ];
  }, [filteredData]);

  // Médias por hora (memoizada)
  const hourlyAverages = useMemo(() => {
    if (filteredData.length === 0) return [];

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const hourlyData = {};

    filteredData.forEach((d) => {
      const hour = d.datetime.getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = { tempSum: 0, humiditySum: 0, count: 0 };
      }
      hourlyData[hour].tempSum += d.temperature;
      hourlyData[hour].humiditySum += d.humidity;
      hourlyData[hour].count++;
    });

    return hours.map(hour => ({
      hour,
      tempAvg: hourlyData[hour] ? (hourlyData[hour].tempSum / hourlyData[hour].count) : 0,
      humidityAvg: hourlyData[hour] ? (hourlyData[hour].humiditySum / hourlyData[hour].count) : 0,
    }));
  }, [filteredData]);

  // Médias diárias (memoizada)
  const dailyAverages = useMemo(() => {
    if (filteredData.length === 0) return [];

    const dailyData = {};

    filteredData.forEach((d) => {
      const dateStr = format(d.datetime, 'yyyy-MM-dd');
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = {
          tempSum: 0,
          tempMin: d.temperature,
          tempMax: d.temperature,
          humiditySum: 0,
          count: 0,
          date: d.datetime
        };
      }
      dailyData[dateStr].tempSum += d.temperature;
      dailyData[dateStr].tempMin = Math.min(dailyData[dateStr].tempMin, d.temperature);
      dailyData[dateStr].tempMax = Math.max(dailyData[dateStr].tempMax, d.temperature);
      dailyData[dateStr].humiditySum += d.humidity;
      dailyData[dateStr].count++;
    });

    return Object.values(dailyData)
      .map(day => ({
        date: day.date,
        dateStr: format(day.date, 'dd/MM'),
        tempAvg: day.tempSum / day.count,
        tempMin: day.tempMin,
        tempMax: day.tempMax,
        humidityAvg: day.humiditySum / day.count,
      }))
      .sort((a, b) => a.date - b.date);
  }, [filteredData]);

  const dailyFirst = useMemo(() => {
    const dailyMap = {};
    filteredData.forEach((d) => {
      const dateKey = format(d.datetime, 'yyyy-MM-dd');
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { temp: [], humidity: [] };
      }
      dailyMap[dateKey].temp.push(d.temperature);
      dailyMap[dateKey].humidity.push(d.humidity);
    });

    return Object.entries(dailyMap).map(([date, values]) => {
      const tempAvg = values.temp.reduce((a, b) => a + b, 0) / values.temp.length;
      const humidityAvg = values.humidity.reduce((a, b) => a + b, 0) / values.humidity.length;
      const heatIndexAvg = tempAvg + 0.33 * humidityAvg - 4;

      return {
        dateStr: format(parseISO(date), 'dd/MM'),
        tempAvg: parseFloat(tempAvg.toFixed(1)),
        humidityAvg: parseFloat(humidityAvg.toFixed(1)),
        heatIndexAvg: parseFloat(heatIndexAvg.toFixed(1)),
      };
    });
  }, [filteredData]);

  const chartConf = {
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    propsForDots: {
      r: '3',
      strokeWidth: '1.5',
    },
  };

  const chartDatas = (key, color) => ({
    labels: dailyAverages.map(d => d.dateStr),
    datasets: [
      {
        data: dailyAverages.map(d => d[key]),
        color: (opacity = 1) => color(opacity),
        strokeWidth: 2,
      },
    ],
  });



  // Previsão para 7 dias (regressão linear simples)
  const forecastData = useMemo(() => {
    if (filteredData.length < 2) return [];

    const temps = filteredData.map(d => d.temperature);
    const times = filteredData.map(d => d.datetime.getTime());

    // Cálculo da regressão linear
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
      const forecastDate = addDays(lastDate, i + 1);
      const forecastTime = forecastDate.getTime();
      const forecastTemp = intercept + slope * forecastTime;

      return {
        date: forecastDate,
        dateStr: format(forecastDate, 'dd/MM'),
        temp: round(forecastTemp, 1),
      };
    });
  }, [filteredData]);

  // Preparar dados para gráficos
  const prepareChartData = useCallback((data, valueKey, color, yAxisSuffix = '') => {
    if (!data || data.length === 0) return null;

    // Mostrar apenas algumas labels para não sobrecarregar
    const showLabel = (index) => {
      if (data.length <= 10) return true;
      return index % Math.ceil(data.length / 10) === 0;
    };

    return {
      labels: data.map((_, i) => (showLabel(i) ? format(data[i].datetime, 'dd/MM') : '')),
      datasets: [{
        data: data.map(d => d[valueKey]),
        color: (opacity = 1) => color(opacity),
        strokeWidth: 2,
      }],
      yAxisSuffix
    };
  }, []);

  // Dados para gráficos (memoizados)
  const correlationChartData = useMemo(() => {
    if (filteredData.length === 0 || !estatisticasCompletas) return null;
  
    const corr = estatisticasCompletas.correlacao;
    const absCorr = Math.abs(corr);
  
    return {
      labels: ['Correlação'],
      datasets: [
        {
          data: [absCorr * 100],
        },
      ],
    };
  }, [estatisticasCompletas, filteredData]);
  
  const ScatterCorrelationChart = () => {
    if (!filteredData || filteredData.length === 0) return null;

  const validData = filteredData.filter(d =>
    !isNaN(d.temperature) && !isNaN(d.humidity)
  );
  if (validData.length === 0) return null;

  const temperatures = validData.map(d => d.temperature);
  const humidities = validData.map(d => d.humidity);

  const minX = Math.min(...temperatures);
  const maxX = Math.max(...temperatures);
  const minY = Math.min(...humidities);
  const maxY = Math.max(...humidities);

  const chartWidth = screenWidth * 1.2;
  const chartHeight = 300;
  const padding = 40;

  const scaleX = value =>
    padding + ((value - minX) / (maxX - minX)) * (chartWidth - padding * 2);
  const scaleY = value =>
    chartHeight - padding - ((value - minY) / (maxY - minY)) * (chartHeight - padding * 2);

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        📍 Dispersão Temperatura × Umidade
      </Text>
      <ScrollView horizontal>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Eixos */}
          <Line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={chartHeight - padding}
            stroke="#999"
            strokeWidth="2"
          />
          <Line
            x1={padding}
            y1={chartHeight - padding}
            x2={chartWidth - padding}
            y2={chartHeight - padding}
            stroke="#999"
            strokeWidth="2"
          />

          {/* Rótulos dos eixos */}
          <SvgText
            x={padding / 2}
            y={padding}
            fontSize="12"
            fill="#333"
            textAnchor="middle"
          >
            {maxY.toFixed(0)}%
          </SvgText>
          <SvgText
            x={padding / 2}
            y={chartHeight - padding}
            fontSize="12"
            fill="#333"
            textAnchor="middle"
          >
            {minY.toFixed(0)}%
          </SvgText>

          <SvgText
            x={padding}
            y={chartHeight - padding + 20}
            fontSize="12"
            fill="#333"
            textAnchor="start"
          >
            {minX.toFixed(1)}°C
          </SvgText>
          <SvgText
            x={chartWidth - padding}
            y={chartHeight - padding + 20}
            fontSize="12"
            fill="#333"
            textAnchor="end"
          >
            {maxX.toFixed(1)}°C
          </SvgText>

          {/* Nome dos eixos */}
          <SvgText
            x={chartWidth / 2}
            y={chartHeight - 5}
            fontSize="14"
            fill="#000"
            textAnchor="middle"
          >
            Temperatura (°C)
          </SvgText>
          <SvgText
            x={15}
            y={chartHeight / 2}
            fontSize="14"
            fill="#000"
            textAnchor="middle"
            transform={`rotate(-90, 15, ${chartHeight / 2})`}
          >
            Umidade (%)
          </SvgText>

          {/* Pontos de dados */}
          {validData.map((d, i) => (
            <Circle
              key={i}
              cx={scaleX(d.temperature)}
              cy={scaleY(d.humidity)}
              r="5"
              fill="#2196F3"
              opacity="0.8"
            />
          ))}
        </Svg>
      </ScrollView>
    </View>
    );
  };
  
  <View style={{ padding: 16 }}>
  {correlationChartData && (
    <>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        📊 Correlação Temperatura × Umidade: {estatisticasCompletas.correlacao.toFixed(2)}
      </Text>
      <BarChart
        data={correlationChartData}
        width={screenWidth - 32}
        height={220}
        fromZero
        yAxisSuffix="%"
        chartConfig={{
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          barPercentage: 0.5,
        }}
        style={{ borderRadius: 8 }}
      />
    </>
  )}

  {/* Gráfico de Dispersão */}
 
</View>

  // Gráfico de médias por hora
  const tempChartData = useMemo(() => {
    prepareChartData(filteredData, 'temperature', (opacity) => `rgba(255, 87, 51, ${opacity})`, '°C'),
      [filteredData, prepareChartData]
    if (dailyAverages.length === 0) return null;

    return {
      labels: dailyAverages.map(d => d.dateStr),
      datasets: [{
        data: dailyAverages.map(d => d.tempAvg),
        color: (opacity = 1) => `rgba(255, 87, 51, ${opacity})`,
        strokeWidth: 2,
      }],
      yAxisSuffix: '°C'
    };
  }, [dailyAverages]);

  const humidityChartData = useMemo(() => {
    prepareChartData(filteredData, 'humidity', (opacity) => `rgba(33, 150, 243, ${opacity})`, '%'),
      [filteredData, prepareChartData]
    if (dailyAverages.length === 0) return null;

    return {
      labels: dailyAverages.map(d => d.dateStr),
      datasets: [{
        data: dailyAverages.map(d => d.humidityAvg),
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 2,
      }],
      yAxisSuffix: '%'
    };
  }, [dailyAverages]);

  const heatIndexChartData = useMemo(() => {
    prepareChartData(filteredData, 'heatIndex', (opacity) => `rgba(156, 39, 176, ${opacity})`, '°C'),
      [filteredData, prepareChartData]
    if (dailyFirst.length === 0) return null;

    return {
      labels: dailyFirst.map(d => d.dateStr),
      datasets: [{
        data: dailyFirst.map(d => d.heatIndexAvg),
        color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`,
        strokeWidth: 2,
      }],
      yAxisSuffix: '°C'
    };
  }, [dailyFirst]);


  // Gráfico de médias por hora
  const hourlyTempChartData = useMemo(() => {
    if (hourlyAverages.length === 0) return null;

    return {
      labels: hourlyAverages.map(h => `${h.hour}h`),
      datasets: [{
        data: hourlyAverages.map(h => round(h.tempAvg, 1)),
        color: (opacity = 1) => `rgba(255, 87, 51, ${opacity})`,
      }],
      yAxisSuffix: '°C'
    };
  }, [hourlyAverages]);

  const hourlyHumidChartData = useMemo(() => {
    if (hourlyAverages.length === 0) return null;

    return {
      labels: hourlyAverages.map(h => `${h.hour}h`),
      datasets: [{
        data: hourlyAverages.map(h => round(h.humidityAvg, 1)),
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
      }],
      yAxisSuffix: '%'
    };
  }, [hourlyAverages]);

  // Gráfico de médias diárias
  const dailyTempChartData = useMemo(() => {
    if (dailyAverages.length === 0) return null;

    return {
      labels: dailyAverages.map(d => d.dateStr),
      datasets: [
        {
          data: dailyAverages.map(d => round(d.tempMax, 1)),
          color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`, // Vermelho para máximas
        },
        {
          data: dailyAverages.map(d => round(d.tempAvg, 1)),
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Verde para médias
        },
        {
          data: dailyAverages.map(d => round(d.tempMin, 1)),
          color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // Azul para mínimas
        }
      ],
      yAxisSuffix: '°C',
      legend: ["Máxima", "Média", "Mínima"]
    };
  }, [dailyAverages]);

  // Gráfico de previsão
  const forecastChartData = useMemo(() => {
    if (forecastData.length === 0) return null;

    return {
      labels: forecastData.map(f => f.dateStr),
      datasets: [{
        data: forecastData.map(f => f.temp),
        color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`,
      }],
      yAxisSuffix: '°C'
    };
  }, [forecastData]);

  // Renderização condicional de gráficos
  const renderChart = useCallback((data, title, config = chartConfigs.temp) => {
    if (!data) return null;

    return (
      <>
        <Text style={styles.chartTitle}>{title}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={data}
            width={Math.max(screenWidth * 1.5, (data.labels?.length || 0) * 50)}            height={220}
            yAxisSuffix={data.yAxisSuffix || ''}
            chartConfig={config}
            bezier
            style={styles.chart}
            fromZero={data.yAxisSuffix === '%'}
            withDots={(data.labels?.length || 0) <= 40}
            segments={5}
          xLabelsOffset={-10}
          yLabelsOffset={10}
          />
        </ScrollView>
      </>
    );
  }, []);

  const renderBarChart = useCallback((data, title, config = chartConfigs.temp, withScroll = false) => {
    if (!data) return null;
  
    const chartComponent = (
      <BarChart
        data={data}
        width={Math.max(screenWidth, (data.labels?.length || 0) * 50)}
        height={220}
        yAxisSuffix={data.yAxisSuffix || ''}
        chartConfig={config}
        style={styles.chart}
        fromZero
        showBarTops
      />
    );
  
    return (
      <>
        <Text style={styles.chartTitle}>{title}</Text>
        {withScroll ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {chartComponent}
          </ScrollView>
        ) : (
          chartComponent
        )}
      </>
    );
  }, []);
  const renderMultiLineChart = useCallback((data, title, config = chartConfigs.temp) => {
    if (!data) return null;

    return (
      <>
        <Text style={styles.chartTitle}>{title}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={data}
            width={Math.max(screenWidth, (data.labels?.length || 0) * 50)}
            height={220}
            yAxisSuffix={data.yAxisSuffix || ''}
            chartConfig={config}
            style={styles.chart}
            fromZero
            withDots={(data.labels?.length || 0) <= 40}
          />
        </ScrollView>
      </>
    );
  }, []);

  const CorrelationScatterChart = ({ filteredData = [], estatisticasCompletas }) => {
  if (filteredData.length === 0) return null;

  // Filtrar dados válidos
  const validData = filteredData.filter(d =>
    !isNaN(d.temperature) && !isNaN(d.humidity) && !isNaN(d.heatIndex)
  );
  const sampledData = validData.slice(0, 100);

  // Dimensões
  const chartWidth = Math.max(screenWidth, 400);
  const chartHeight = 300;
  const margin = 40;

  // Escalas
  const minX = Math.min(...sampledData.map(d => d.temperature));
  const maxX = Math.max(...sampledData.map(d => d.temperature));
  const minY = Math.min(...sampledData.map(d => d.humidity));
  const maxY = Math.max(...sampledData.map(d => d.humidity));

  const scaleX = (val) =>
    margin + ((val - minX) / (maxX - minX)) * (chartWidth - margin * 2);
  const scaleY = (val) =>
    chartHeight - margin - ((val - minY) / (maxY - minY)) * (chartHeight - margin * 2);

  const getPointColor = (d) => {
    if (d.heatIndex < 15) return 'rgba(100, 181, 246, 0.8)'; // Azul
    if (d.heatIndex < 25) return 'rgba(129, 199, 132, 0.8)'; // Verde
    return 'rgba(239, 83, 80, 0.8)'; // Vermelho
  };

  // Gerar eixos com marcações (tick steps)
  const xSteps = 5;
  const ySteps = 5;

  const xLabels = Array.from({ length: xSteps + 1 }, (_, i) =>
    minX + ((maxX - minX) / xSteps) * i
  );
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) =>
    minY + ((maxY - minY) / ySteps) * i
  );

  return (
    <View ref={chartRef} style={{ marginVertical: 16 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>
        📊 Dispersão: Temperatura vs Umidade
      </Text>
      <Text style={{ marginBottom: 8 }}>
        Correlação: {estatisticasCompletas?.correlacao?.toFixed(2) ?? 'N/A'} - 
        {estatisticasCompletas?.correlacao > 0.7 ? ' Forte positiva' :
         estatisticasCompletas?.correlacao > 0.3 ? ' Moderada positiva' :
         estatisticasCompletas?.correlacao < -0.7 ? ' Forte negativa' :
         estatisticasCompletas?.correlacao < -0.3 ? ' Moderada negativa' :
         ' Fraca ou insignificante'}
      </Text>

      <ScrollView horizontal>
        <Svg width={chartWidth} height={chartHeight}>

          {/* Eixo X */}
          <Line
            x1={margin}
            y1={chartHeight - margin}
            x2={chartWidth - margin}
            y2={chartHeight - margin}
            stroke="#000"
            strokeWidth="1"
          />
          {xLabels.map((label, i) => {
            const x = scaleX(label);
            return (
              <React.Fragment key={`x-${i}`}>
                <Line
                  x1={x}
                  y1={chartHeight - margin}
                  x2={x}
                  y2={chartHeight - margin + 5}
                  stroke="#000"
                  strokeWidth="1"
                />
                <SvgText
                  x={x}
                  y={chartHeight - margin + 15}
                  fontSize="10"
                  fill="#000"
                  textAnchor="middle"
                >
                  {label.toFixed(1)}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Eixo Y */}
          <Line
            x1={margin}
            y1={margin}
            x2={margin}
            y2={chartHeight - margin}
            stroke="#000"
            strokeWidth="1"
          />
          {yLabels.map((label, i) => {
            const y = scaleY(label);
            return (
              <React.Fragment key={`y-${i}`}>
                <Line
                  x1={margin - 5}
                  y1={y}
                  x2={margin}
                  y2={y}
                  stroke="#000"
                  strokeWidth="1"
                />
                <SvgText
                  x={margin - 8}
                  y={y + 4}
                  fontSize="10"
                  fill="#000"
                  textAnchor="end"
                >
                  {label.toFixed(0)}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Pontos */}
          {sampledData.map((d, index) => (
            <Circle
              key={index}
              cx={scaleX(d.temperature)}
              cy={scaleY(d.humidity)}
              r={4}
              fill={getPointColor(d)}
            />
          ))}
        </Svg>
      </ScrollView>
    </View>
  );
};

const TemperaturaHorarioChart = ({ filteredData }) => {
  // Agrupa temperatura por hora (0-23), calcula média
  const dataPorHora = useMemo(() => {
    const tempPorHora = Array(24).fill(null).map(() => []);
    filteredData.forEach(({ temperature, hour }) => {
      if (temperature != null && hour != null && hour >= 0 && hour < 24) {
        tempPorHora[hour].push(temperature);
      }
    });
    return tempPorHora.map(arr =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
    );
  }, [filteredData]);

  const chartData = {
    labels: Array.from({ length: 24 }, (_, i) => i.toString()),
    datasets: [
      {
        data: dataPorHora,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <View ref={chartRef} style={{ marginVertical: 16 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>
        🌡️ Temperatura Média por Hora
      </Text>
      <LineChart
        data={chartData}
        width={screenWidth - 32}
        height={220}
        yAxisSuffix="°C"
        chartConfig={{
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        bezier
        style={{ borderRadius: 8 }}
      />
    </View>
  );
};

const ScatterTempHorarioChart = ({ filteredData }) => {
  if (!filteredData || filteredData.length === 0) return null;

  const validData = filteredData.filter(d =>
    d.temperature != null && d.hour != null
  );

  if (validData.length === 0) return null;

  const hours = validData.map(d => d.hour);
  const temps = validData.map(d => d.temperature);

  const minX = Math.min(...hours);
  const maxX = Math.max(...hours);
  const minY = Math.min(...temps);
  const maxY = Math.max(...temps);

  const chartWidth = screenWidth - 40;
  const chartHeight = 250;

  const scaleX = value => ((value - minX) / (maxX - minX)) * chartWidth;
  const scaleY = value =>
    chartHeight - ((value - minY) / (maxY - minY)) * chartHeight;

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        📍 Dispersão Temperatura × Horário
      </Text>
      <Svg width={chartWidth} height={chartHeight}>
        {/* Eixos */}
        <Line
          x1={0}
          y1={chartHeight}
          x2={chartWidth}
          y2={chartHeight}
          stroke="#000"
          strokeWidth="2"
        />
        <Line
          x1={0}
          y1={0}
          x2={0}
          y2={chartHeight}
          stroke="#000"
          strokeWidth="2"
        />

        {/* Labels eixo X (horas) */}
        {Array.from({ length: 25 }).map((_, i) => {
          const x = (i / 24) * chartWidth;
          return (
            <SvgText
              key={`x-label-${i}`}
              x={x}
              y={chartHeight + 15}
              fontSize="10"
              fill="#000"
              textAnchor="middle"
            >
              {i}
            </SvgText>
          );
        })}

        {/* Labels eixo Y (temperatura) */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = chartHeight - t * chartHeight;
          const tempLabel = (minY + t * (maxY - minY)).toFixed(1);
          return (
            <SvgText
              key={`y-label-${i}`}
              x={-5}
              y={y}
              fontSize="10"
              fill="#000"
              textAnchor="end"
              alignmentBaseline="middle"
            >
              {tempLabel}
            </SvgText>
          );
        })}

        {/* Pontos */}
        {validData.map((d, i) => (
          <Circle
            key={i}
            cx={scaleX(d.hour)}
            cy={scaleY(d.temperature)}
            r={4}
            fill="#ff6384"
          />
        ))}
      </Svg>
    </View>
  );
};
const gerarImagemDoGrafico = async () => {
  const uri = await captureRef(chartRef, {
    format: 'png',
    quality: 1,
  });
  setChartUri(uri); // <-- Agora a imagem está pronta
};

const chartRef = useRef();
const [chartUri, setChartUri] = useState(null);
// No corpo do seu componente (não dentro da função)
useEffect(() => {
  // Simulando carregamento dos gráficos
  const timeout = setTimeout(() => {
    setLayoutReady(true);
  }, 2000);

  return () => clearTimeout(timeout);
}, []);

const [contentWidth, setContentWidth] = useState(null);

// Quando o conteúdo for renderizado, captura a largura total
const onContentLayout = (event) => {
  const { width } = event.nativeEvent.layout;
  setContentWidth(width);
};


const generatePDF = useCallback(async () => {
  console.log('Botão pressionado - Iniciando geração de PDF'); // Debug 1
  setIsGeneratingPDF(true);
    
  try {
    console.log('Aguardando interações...'); // Debug 2
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('Verificando viewRef...', viewRef.current); // Debug 3
    if (!viewRef.current) {
      console.warn('viewRef não está definido!');
      return;
    }

    console.log('Capturando screenshot...'); // Debug 4
    const uri = await captureRef(viewRef, { format: 'png', quality: 0.8 });
    console.log('Screenshot capturado:', uri); // Debug 5

    const base64Image = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  

    const { uri: pdfUri } = await Print.printToFileAsync({
      html: `
        <html>
          <head>
            <style>
             @page { size: A4 landscape; }
              body { font-family: Arial; padding: 20px; }
              h1 { color: #333; text-align: center; }
              h2 { color: #444; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
              .section { margin-bottom: 20px; }
              .stats { margin-left: 20px; }
              .row { display: flex; justify-content: space-between; }
              .col { width: 48%; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>Relatório Completo de Temperatura e Umidade</h1>
            
            <div class="section">
              <h2>Período Analisado</h2>
              <p>De ${startDate} a ${endDate}</p>
              <p>Total de registros: ${filteredData.length}</p>
            </div>
            
            <div class="section">
              <h2>Estatísticas Detalhadas</h2>
              <div class="row">
                <div class="col">
                  <h3>Temperatura (°C)</h3>
                  <table>
                    <tr><th>Métrica</th><th>Valor</th></tr>
                    <tr><td>Média</td><td>${estatisticasCompletas?.temperatura.avg || 'N/A'}</td></tr>
                    <tr><td>Mínima</td><td>${estatisticasCompletas?.temperatura.min || 'N/A'}</td></tr>
                    <tr><td>Máxima</td><td>${estatisticasCompletas?.temperatura.max || 'N/A'}</td></tr>
                    <tr><td>Moda</td><td>${estatisticasCompletas?.temperatura.moda?.join(', ') || 'N/A'}</td></tr>
                    <tr><td>Mediana</td><td>${estatisticasCompletas?.temperatura.median || 'N/A'}</td></tr>
                    <tr><td>Q1 (25%)</td><td>${estatisticasCompletas?.temperatura.q1 || 'N/A'}</td></tr>
                    <tr><td>Q3 (75%)</td><td>${estatisticasCompletas?.temperatura.q3 || 'N/A'}</td></tr>
                    <tr><td>Desvio Padrão</td><td>${estatisticasCompletas?.temperatura.stdDev || 'N/A'}</td></tr>
                    <tr><td>Assimetria</td><td>${estatisticasCompletas?.temperatura.skewness || 'N/A'}</td></tr>
                    <tr><td>Curtose</td><td>${estatisticasCompletas?.temperatura.kurtosis || 'N/A'}</td></tr>
                  </table>
                </div>
                <div class="col">
                  <h3>Umidade (%)</h3>
                  <table>
                    <tr><th>Métrica</th><th>Valor</th></tr>
                    <tr><td>Média</td><td>${estatisticasCompletas?.umidade.avg || 'N/A'}</td></tr>
                    <tr><td>Mínima</td><td>${estatisticasCompletas?.umidade.min || 'N/A'}</td></tr>
                    <tr><td>Máxima</td><td>${estatisticasCompletas?.umidade.max || 'N/A'}</td></tr>
                    <tr><td>Moda</td><td>${estatisticasCompletas?.umidade.moda?.join(', ') || 'N/A'}</td></tr>
                    <tr><td>Mediana</td><td>${estatisticasCompletas?.umidade.median || 'N/A'}</td></tr>
                    <tr><td>Q1 (25%)</td><td>${estatisticasCompletas?.umidade.q1 || 'N/A'}</td></tr>
                    <tr><td>Q3 (75%)</td><td>${estatisticasCompletas?.umidade.q3 || 'N/A'}</td></tr>
                    <tr><td>Desvio Padrão</td><td>${estatisticasCompletas?.umidade.stdDev || 'N/A'}</td></tr>
                    <tr><td>Assimetria</td><td>${estatisticasCompletas?.umidade.skewness || 'N/A'}</td></tr>
                    <tr><td>Curtose</td><td>${estatisticasCompletas?.umidade.kurtosis || 'N/A'}</td></tr>
                  </table>
                </div>
              </div>
              <h3>Correlação Temperatura-Umidade</h3>
              <p>${estatisticasCompletas?.correlacao || 'N/A'} - ${
                estatisticasCompletas?.correlacao > 0.5 ? 'Forte correlação positiva' : 
                estatisticasCompletas?.correlacao < -0.5 ? 'Forte correlação negativa' : 'Fraca ou nenhuma correlação'
              }</p>
            </div>
            
            <div class="section">
              <h2>Gráficos</h2>
              <img src="data:image/png;base64,${base64Image}" />
            </div>
             <div>
              <img src="data:image/png;base64,${base64Image}" style="max-width: 100%;" />
            </div>
            
            <div class="section">
              <h2>Previsão para os Próximos 7 Dias</h2>
              <table>
                <tr><th>Data</th><th>Temperatura Prevista (°C)</th></tr>
                ${forecastData.map(f => `
                  <tr>
                    <td>${f.dateStr}</td>
                    <td>${f.temp}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
          </body>
        </html>
      `,
       orientation: 'landscape'
    });

     console.log('PDF gerado com sucesso:', pdfUri); // Debug 7
    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Compartilhar Relatório PDF',
    });
    
  } catch (error) {
    console.error('Erro na geração do PDF:', error); // Debug 8
    Alert.alert('Erro', 'Não foi possível gerar o PDF: ' + error.message);
  } finally {
    console.log('Finalizando processo...'); // Debug 9
    setIsGeneratingPDF(false);
  }

}, [viewRef, estatisticasCompletas, startDate, endDate, filteredData.length, forecastData]);


{isGeneratingPDF && (
  <View style={{ position: 'absolute', left: -9999, top: 0 }}>
    <View ref={viewRef} onLayout={onContentLayout} style={{ width: 800 }}>
      {/* Renderize aqui uma cópia simplificada dos seus gráficos e informações que quer capturar */}
      <Text>Teste de conteúdo para PDF</Text>
    </View>
  </View>
)}

  // Componentes modais
  const StatsModal = () => (
    <Modal visible={activeModal === 'stats'} animationType="slide">
      <View style={styles.modalContainer}>
        <ScrollView>
          <Text style={styles.modalTitle}>📊 Estatísticas Detalhadas</Text>

          {estatisticasCompletas ? (
            <>
              <Text style={styles.modalSubtitle}>Temperatura (°C)</Text>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Média:</Text>
                <Text>{estatisticasCompletas.temperatura.avg}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Mínima:</Text>
                <Text>{estatisticasCompletas.temperatura.min}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Máxima:</Text>
                <Text>{estatisticasCompletas.temperatura.max}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Moda:</Text>
                <Text>{estatisticasCompletas.temperatura.moda.join(', ')}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Mediana:</Text>
                <Text>{estatisticasCompletas.temperatura.median}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Q1 (25%):</Text>
                <Text>{estatisticasCompletas.temperatura.q1}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Q3 (75%):</Text>
                <Text>{estatisticasCompletas.temperatura.q3}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Desvio Padrão:</Text>
                <Text>{estatisticasCompletas.temperatura.stdDev}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Assimetria:</Text>
                <Text>{estatisticasCompletas.temperatura.skewness}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Curtose:</Text>
                <Text>{estatisticasCompletas.temperatura.kurtosis}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Distribuição Normal:</Text>
                <Text style={estatisticasCompletas.temperatura.isNormal ? styles.normalText : styles.notNormalText}>
                  {estatisticasCompletas.temperatura.isNormal ? 'Sim' : 'Não'}
                </Text>
              </View>

              <Text style={styles.modalSubtitle}>Umidade (%)</Text>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Média:</Text>
                <Text>{estatisticasCompletas.umidade.avg}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Mínima:</Text>
                <Text>{estatisticasCompletas.umidade.min}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Máxima:</Text>
                <Text>{estatisticasCompletas.umidade.max}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Moda:</Text>
                <Text>{estatisticasCompletas.umidade.moda.join(', ')}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Mediana:</Text>
                <Text>{estatisticasCompletas.umidade.median}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Q1 (25%):</Text>
                <Text>{estatisticasCompletas.umidade.q1}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Q3 (75%):</Text>
                <Text>{estatisticasCompletas.umidade.q3}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Desvio Padrão:</Text>
                <Text>{estatisticasCompletas.umidade.stdDev}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Assimetria:</Text>
                <Text>{estatisticasCompletas.umidade.skewness}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Curtose:</Text>
                <Text>{estatisticasCompletas.umidade.kurtosis}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Distribuição Normal:</Text>
                <Text style={estatisticasCompletas.umidade.isNormal ? styles.normalText : styles.notNormalText}>
                  {estatisticasCompletas.umidade.isNormal ? 'Sim' : 'Não'}
                </Text>
              </View>

              <Text style={styles.modalSubtitle}>Correlação</Text>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Temperatura x Umidade:</Text>
                <Text>{estatisticasCompletas.correlacao}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Interpretação:</Text>
                <Text>
                  {estatisticasCompletas.correlacao > 0.5 ? 'Forte correlação positiva' :
                    estatisticasCompletas.correlacao < -0.5 ? 'Forte correlação negativa' :
                      'Fraca ou nenhuma correlação'}
                </Text>
              </View>
            </>
          ) : (
            <Text>Nenhum dado disponível</Text>
          )}

          <Button title="Fechar" onPress={() => setActiveModal(null)} />
        </ScrollView>
      </View>
    </Modal>
  );

  const ClassificationModal = () => (
    <Modal visible={activeModal === 'classification'} animationType="slide">
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>🌡️ Classificação de Temperatura</Text>

        {tempClassificationData.length > 0 ? (
          <>
            <Text>Frio (&lt;15°C): {tempClassificationData[0].population} registros</Text>
            <Text>Agradável (15-25°C): {tempClassificationData[1].population} registros</Text>
            <Text>Quente (≥25°C): {tempClassificationData[2].population} registros</Text>

            <PieChart
              data={tempClassificationData}
              width={screenWidth - 40}
              height={200}
              chartConfig={chartConfigs.temp}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </>
        ) : (
          <Text>Nenhum dado disponível</Text>
        )}

        <Button title="Fechar" onPress={() => setActiveModal(null)} />
      </View>
    </Modal>
  );

  const HourlyModal = () => (
    <Modal visible={activeModal === 'hourly'} animationType="slide">
      <View style={styles.modalContainer}>
        <ScrollView>
          <Text style={styles.modalTitle}>⏱️ Médias por Hora</Text>

          {hourlyAverages.length > 0 ? (
            <>
              <Text style={styles.modalSubtitle}>Temperatura (°C)</Text>
              {hourlyAverages.map((hour, i) => (
                <View key={`temp-${i}`} style={styles.modalRow}>
                  <Text style={styles.modalLabel}>{hour.hour}h:</Text>
                  <Text>{round(hour.tempAvg, 1)}°C</Text>
                </View>
              ))}

              <Text style={styles.modalSubtitle}>Umidade (%)</Text>
              {hourlyAverages.map((hour, i) => (
                <View key={`humid-${i}`} style={styles.modalRow}>
                  <Text style={styles.modalLabel}>{hour.hour}h:</Text>
                  <Text>{round(hour.humidityAvg, 1)}%</Text>
                </View>
              ))}
            </>
          ) : (
            <Text>Nenhum dado disponível</Text>
          )}

          <Button title="Fechar" onPress={() => setActiveModal(null)} />
        </ScrollView>
      </View>
    </Modal>
  );

  const DailyModal = () => (
    <Modal visible={activeModal === 'daily'} animationType="slide">
      <View style={styles.modalContainer}>
        <ScrollView>
          <Text style={styles.modalTitle}>📅 Médias Diárias</Text>

          {dailyAverages.length > 0 ? (
            <>
              <Text style={styles.modalSubtitle}>Temperatura (°C)</Text>
              {dailyAverages.map((day, i) => (
                <View key={`day-${i}`} style={styles.modalRow}>
                  <Text style={styles.modalLabel}>{day.dateStr}:</Text>
                  <Text>Média: {round(day.tempAvg, 1)}</Text>
                  <Text> | Máx: {round(day.tempMax, 1)}</Text>
                  <Text> | Mín: {round(day.tempMin, 1)}</Text>
                </View>
              ))}

              <Text style={styles.modalSubtitle}>Umidade (%)</Text>
              {dailyAverages.map((day, i) => (
                <View key={`humid-day-${i}`} style={styles.modalRow}>
                  <Text style={styles.modalLabel}>{day.dateStr}:</Text>
                  <Text>{round(day.humidityAvg, 1)}%</Text>
                </View>
              ))}
            </>
          ) : (
            <Text>Nenhum dado disponível</Text>
          )}

          <Button title="Fechar" onPress={() => setActiveModal(null)} />
        </ScrollView>
      </View>
    </Modal>
  );




  const ForecastModal = () => (
    <Modal visible={activeModal === 'forecast'} animationType="slide">
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>🔮 Previsão para 7 Dias</Text>

        {forecastData.length > 0 ? (
          <>
            {forecastData.map((day, i) => (
              <View key={`forecast-${i}`} style={styles.modalRow}>
                <Text style={styles.modalLabel}>{day.dateStr}:</Text>
                <Text>{day.temp}°C</Text>
              </View>
            ))}
          </>
        ) : (
          <Text>Dados insuficientes para previsão</Text>
        )}

        <Button title="Fechar" onPress={() => setActiveModal(null)} />
      </View>
    </Modal>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      ref={viewRef}
    >
      <Text style={styles.title}>☀️ ClimaTempo Analisador Avançado</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#2196F3" style={styles.loader} />
      ) : (
        <>
          <Button
            title="Selecionar Arquivo CSV"
            onPress={handleFileUpload}
            color="#2196F3"
            disabled={isLoading}
          />
          {rawData.length > 0 && (
            <>
              {/* Filtros de data */}
              <View style={styles.filterContainer}>
                <View style={styles.inputGroup}>
                  <Text>Data Início:</Text>
                  <TextInput
                    style={styles.input}
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="yyyy-mm-dd"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text>Data Fim:</Text>
                  <TextInput
                    style={styles.input}
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="yyyy-mm-dd"
                  />
                </View>
              </View>

              {/* Resumo estatístico */}
              <View style={styles.statsContainer}>
                <Text style={styles.statsTitle}>📊 Estatísticas do Período</Text>

                {estatisticasCompletas && (
                  <>
                    <View style={styles.row}>
                      <View style={styles.metricCard}>
                        <Text style={styles.metricTitle}>🌡️ Temperatura Média</Text>
                        <Text style={styles.metricValue}>{estatisticasCompletas.temperatura.avg}°C</Text>
                      </View>
                      <View style={styles.metricCard}>
                        <Text style={styles.metricTitle}>🔥 Máx. Temperatura</Text>
                        <Text style={styles.metricValue}>{estatisticasCompletas.temperatura.max}°C</Text>
                      </View>
                      <View style={styles.metricCard}>
                        <Text style={styles.metricTitle}>❄️ Mín. Temperatura</Text>
                        <Text style={styles.metricValue}>{estatisticasCompletas.temperatura.min}°C</Text>
                      </View>
                    </View>

                    <View style={styles.row}>
                      <View style={styles.metricCard}>
                        <Text style={styles.metricTitle}>💧 Umidade Média</Text>
                        <Text style={styles.metricValue}>{estatisticasCompletas.umidade.avg}%</Text>
                      </View>
                      <View style={styles.metricCard}>
                        <Text style={styles.metricTitle}>😓 Sensação Térmica</Text>
                        <Text style={styles.metricValue}>{estatisticasCompletas.heatIndex.avg}°C</Text>
                      </View>
                      <View style={styles.metricCard}>
                        <Text style={styles.metricTitle}>📝 Total Registros</Text>
                        <Text style={styles.metricValue}>{estatisticasCompletas.totalRecords}</Text>
                      </View>
                    </View>

                    <View style={styles.row}>
                      <View style={styles.metricCard}>
                        <Text style={styles.metricTitle}>📈 Correlação</Text>
                        <Text style={styles.metricValue}>{estatisticasCompletas.correlacao}</Text>
                        <Text style={styles.metricSubtitle}>
                          {estatisticasCompletas.correlacao > 0.5 ? 'Positiva forte' :
                            estatisticasCompletas.correlacao < -0.5 ? 'Negativa forte' : 'Fraca'}
                        </Text>
                      </View>
                    </View>
                  </>
                )}

                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => setActiveModal('stats')}
                >
                  <Text style={styles.detailsButtonText}>Estatísticas Detalhadas</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => setActiveModal('classification')}
                >
                  <Text style={styles.detailsButtonText}>Classificação de Temperatura</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => setActiveModal('hourly')}
                >
                  <Text style={styles.detailsButtonText}>Dados por Hora</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => setActiveModal('daily')}
                >
                  <Text style={styles.detailsButtonText}>Dados Diários</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => setActiveModal('forecast')}
                >
                  <Text style={styles.detailsButtonText}>Previsão para 7 Dias</Text>
                </TouchableOpacity>
              </View>

              {/* Gráficos principais */}
              {renderChart(tempChartData, '📈 Temperatura ao Longo do Tempo')}
              {renderBarChart(
                humidityChartData,
                '💧 Umidade ao Longo do Tempo',
                chartConfigs.humidity,
                true)}
              {renderChart(heatIndexChartData, '😓 Sensação Térmica ao Longo do Tempo')}

              {/* Gráfico de classificação */}
              <Text style={styles.chartTitle}>🌡️ Classificação de Temperatura</Text>
              {tempClassificationData.length > 0 ? (
                <PieChart
                  data={tempClassificationData}
                  width={screenWidth - 32}
                  height={220}
                  chartConfig={chartConfigs.temp}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                  style={styles.chart}
                />
              ) : (
                <Text style={{ textAlign: 'center' }}>Nenhum dado disponível</Text>
              )}

              {/* Gráficos de médias por hora */}
              {renderChart(hourlyTempChartData, '⏱️ Temperatura Média por Hora do Dia')}
              {renderChart(hourlyHumidChartData, '⏱️ Umidade Média por Hora do Dia')}

              {/* Gráfico de médias diárias */}
              {renderMultiLineChart(dailyTempChartData, '📅 Temperaturas Diárias (Máx, Média, Mín)')}

              {/* Gráfico de correlação */}
              {correlationChartData && (
                <>
                  <Text style={styles.chartTitle}>📊 Correlação entre Temperatura e Umidade</Text>
                  <Text style={styles.chartSubtitle}>
                    Valor: {estatisticasCompletas?.correlacao} -
                    {estatisticasCompletas?.correlacao > 0.7 ? ' Correlação positiva muito forte' :
                      estatisticasCompletas?.correlacao > 0.3 ? ' Correlação positiva moderada' :
                        estatisticasCompletas?.correlacao < -0.7 ? ' Correlação negativa muito forte' :
                          estatisticasCompletas?.correlacao < -0.3 ? ' Correlação negativa moderada' :
                            ' Correlação fraca ou insignificante'}
                  </Text>
                  <BarChart
                    data={correlationChartData}
                    width={screenWidth - 32}
                    height={220}
                    yAxisSuffix="%"
                    chartConfig={chartConfigs.correlation}
                    style={styles.chart}
                    fromZero
                    showBarTops
                  />
                </>
              )}

              {/* Gráfico de previsão */}
              {forecastData.length > 0 && renderChart(forecastChartData, '🔮 Previsão de Temperatura para 7 Dias')}

              {/* Botão para gerar PDF */}
              <Button
                title="Gerar Relatório em PDF"
                onPress={generatePDF}
                color="#4CAF50"
                style={styles.pdfButton}
              />
            </>
          )}
        </>
      )}

      {/* Modais */}
      <StatsModal />
      <ClassificationModal />
      <HourlyModal />
      <DailyModal />
      <CorrelationScatterChart />
      <ScatterCorrelationChart />
      <ForecastModal />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  loader: {
    marginVertical: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  statsContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  metricTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  metricSubtitle: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  detailsButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
    color: '#333',
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#2196F3',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalLabel: {
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 100,
  },
  normalText: {
    color: 'green',
  },
  notNormalText: {
    color: 'orange',
  },
  pdfButton: {
    marginTop: 20,
    marginBottom: 30,
  },scatterDot: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
  },
});

export default Relatorios;