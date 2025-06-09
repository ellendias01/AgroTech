import React, { useState, useEffect,useMemo,useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Menu, Button } from 'react-native-paper';
import ViewShot from 'react-native-view-shot';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';


import DateTimePicker from '@react-native-community/datetimepicker';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import StatsModal from './StatsModal';
import ClassificationModal from './ClassificationModal';
import CorrelationScatterChart from './CorrelationScatterChart';
import HourlyModal from './HourlyModal';
import DailyModal from './DailyModal';
import ScatterTempHorarioChart from './ScatterTempHorarioChart';
import { calcularEstatisticas } from '../../utils/relatorios/statistics';
import ForecastModal from  '../Relatorios/ForecastModal'
import { gerarPrevisao } from '../../utils/relatorios/forecast';
import { captureViewAsPDF } from '../../utils/relatorios/pdfUtils';
import LinearTemperatureForecast from '../Relatorios/ForecastModal';
import  ForecastGrafico from '../Relatorios/PrevisaoGrafico'
import { ApiRoutes } from '../../config/api';
import axios from 'axios';

const screenWidth = Dimensions.get('window').width;

const StatisticsPage = () => {
  // Estados para controle da interface
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [visible, setVisible] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState('Todos os Galpões');
  const [dados, setDados] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
const [showClassificationModal, setShowClassificationModal] = useState(false);
const [showHourlyModal, setShowHourlyModal] = useState(false);
const [showOptions, setShowOptions] = useState(false);
const [showStatsModal, setShowStatsModal] = useState(false);
const [showDailyModal, setShowDailyModal] = useState(false); 
const [tooltipPos, setTooltipPos] = useState({ visible: false, x: 0, y: 0, value: 0 });
 const [modalForecast, setModalForecast] = useState(false);
const chartRef = useRef();
// Formatador de datas para o padrão YYYY-MM-DD
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Calcula a data de 10 dias atrás
  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 10);
    return date;
  };
  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const handleSelect = (value) => {
    setSelectedWarehouse(value);
    closeMenu();};
const forecastMemo = useMemo(() => gerarPrevisao(dados), [dados]);
 const estatisticas = useMemo(() => calcularEstatisticas(data), [data]);
  // Efeito para carregar os dados quando o componente monta ou quando os filtros mudam
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
  
        const today = new Date();
        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedEndDate = endDate.toISOString().split('T')[0];

let url = ApiRoutes.byPeriod(formattedStartDate, formattedEndDate);
if (selectedWarehouse && selectedWarehouse !== 'Todos os Galpões') {
  url += `&local_name=${encodeURIComponent(selectedWarehouse)}`;
}


  
        console.log("🔍 Buscando dados da URL:", url);

        const res = await fetch(url);
  
        // 🔎 Se não for resposta 200, lança erro
        if (!res.ok) {
          const errorText = await res.text();
          console.error("❌ Erro do servidor:", errorText);
          throw new Error(`Erro ${res.status}: ${errorText}`);
        }
  
        const jsonData = await res.json();
  
        // 🔄 Processa os dados recebidos
        const processedData = jsonData
          .map(item => ({
            ...item,
            datetime: new Date(item.datetime),
            temperature: parseFloat(item.temperature),
            humidity: parseFloat(item.humidity),
          }))
          .filter(item => item.datetime <= today); // só dados até agora
  
        if (processedData.length === 0) {
          console.warn('⚠️ Nenhum dado encontrado para o filtro atual.');
        }
  
        setData(processedData);
      } catch (err) {
        console.error("❌ Erro ao buscar dados:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  
    const interval = setInterval(fetchData, 5 * 60 * 1000); // Atualiza a cada 5 min
  
    return () => clearInterval(interval); // Limpa ao desmontar
  }, [startDate, endDate, selectedWarehouse]);
  
  
  // Manipuladores de data
  const onStartDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(Platform.OS === 'ios');
    setStartDate(currentDate);
  };

  const onEndDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(Platform.OS === 'ios');
    
    // Garante que a data final não seja futura
    const today = new Date();
    if (currentDate > today) {
      setEndDate(today);
    } else {
      setEndDate(currentDate);
    }
  };

  // Cálculos estatísticos
  const calculateStats = (field) => {
    if (data.length === 0) return {};
    
    const values = data.map(item => item[field]);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    
    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    
    // Mediana
    const middle = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0 
      ? (sorted[middle - 1] + sorted[middle]) / 2 
      : sorted[middle];
    
    // Desvio padrão
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(avgSquareDiff);
    
    return {
      average: avg,
      min,
      max,
      median,
      stdDev,
      count: values.length
    };
  };

  const tempStats = calculateStats('temperature');
  const humidityStats = calculateStats('humidity');

  // Agrupa dados por dia para os gráficos
  const groupByDay = () => {
    const grouped = {};
    
    data.forEach(item => {
      const dateStr = item.datetime.toISOString().split('T')[0];
      if (!grouped[dateStr]) {
        grouped[dateStr] = {
          date: dateStr,
          temperatures: [],
          humidities: []
        };
      }
      grouped[dateStr].temperatures.push(item.temperature);
      grouped[dateStr].humidities.push(item.humidity);
    });
    
    // Calcula médias diárias
    return Object.values(grouped).map(day => ({
      date: day.date,
      avgTemp: day.temperatures.reduce((a, b) => a + b, 0) / day.temperatures.length,
      avgHumidity: day.humidities.reduce((a, b) => a + b, 0) / day.humidities.length
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const dailyData = groupByDay();

  // Configurações dos gráficos
 const chartConfig = {
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(255, 87, 51, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: '4', strokeWidth: '2', stroke: '#FF5733' },
  };

  const tempChartConfig = { ...chartConfig, color: (o = 1) => `rgba(255, 99, 71, ${o})`, propsForDots: { ...chartConfig.propsForDots, stroke: '#FF6347' } };
  const humidityChartConfig = { ...chartConfig, color: (o = 1) => `rgba(51, 153, 255, ${o})`, propsForDots: { ...chartConfig.propsForDots, stroke: '#3399FF' } };
  const barChartConfig = { ...chartConfig, color: (o = 1) => `rgba(102, 102, 255, ${o})`, propsForDots: {} };
  // Função para filtrar labels para mostrar a cada 3 horas
  const filterHourlyLabels = (hours) => {
    return hours.map((hour, index) => index % 1 === 0 ? hour.toString() : '');
  };
  
const getDailyAverages = () => {
  if (data.length === 0) return [];

  const groupedByDay = {};

  data.forEach(item => {
    const dateStr = item.datetime.toISOString().split('T')[0];
    if (!groupedByDay[dateStr]) {
      groupedByDay[dateStr] = {
        dateStr,
        temps: [],
        humidities: []
      };
    }
    groupedByDay[dateStr].temps.push(item.temperature);
    groupedByDay[dateStr].humidities.push(item.humidity);
  });

  return Object.values(groupedByDay).map(day => ({
    dateStr: day.dateStr,
    tempAvg: day.temps.reduce((a, b) => a + b, 0) / day.temps.length,
    tempMin: Math.min(...day.temps),
    tempMax: Math.max(...day.temps),
    humidityAvg: day.humidities.reduce((a, b) => a + b, 0) / day.humidities.length,
    humidityMin: Math.min(...day.humidities),
    humidityMax: Math.max(...day.humidities)
  })).sort((a, b) => new Date(a.dateStr) - new Date(b.dateStr));
};
const getHourlyAverages = () => {
  if (data.length === 0) return [];

  const hourlyData = {};

  data.forEach(item => {
    const hour = item.datetime.getHours();
    if (!hourlyData[hour]) {
      hourlyData[hour] = {
        tempSum: 0,
        humiditySum: 0,
        count: 0
      };
    }
    hourlyData[hour].tempSum += item.temperature;
    hourlyData[hour].humiditySum += item.humidity;
    hourlyData[hour].count++;
  });

  return Object.keys(hourlyData).map(hour => ({
    hour: parseInt(hour),
    tempAvg: hourlyData[hour].tempSum / hourlyData[hour].count,
    humidityAvg: hourlyData[hour].humiditySum / hourlyData[hour].count
  })).sort((a, b) => a.hour - b.hour);
};

 const dailyAverages = getDailyAverages();
  const hourlyAverages = getHourlyAverages();

const formatDateLabel = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}`;
  };

// Para o ClassificationModal
const getTemperatureClassificationData = () => {
  if (data.length === 0) return [];
  
  const quente = data.filter(item => item.temperature >= 25).length;
  const bom = data.filter(item => item.temperature < 25).length;
  
  return [
    {
      name: "Quente (≥25°C)",
      population: quente,
      color: "#FF4500",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    },
    {
      name: "Bom (<25°C)",
      population: bom,
      color: "#32CD32",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    }
  ];
};
 const dataPorHora = useMemo(() => {
  const tempPorHora = Array(24).fill(null).map(() => []);

  data.forEach(({ temperature, datetime }) => {
    const date = new Date(datetime);
    const hour = date.getHours();
    if (temperature != null) {
      tempPorHora[hour].push(temperature);
    }
  });

  return tempPorHora.map(arr =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null
  );
}, [data]);

 const chartData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
    datasets: [{
      data: dataPorHora,
      strokeWidth: 2,
    }],
  };

<TouchableOpacity 
  style={styles.modalButton}
  onPress={() => handleExportPDF()}
>
  <Text style={styles.modalButtonText}>Exportar para PDF</Text>
</TouchableOpacity>

// Adicione esta função no seu componente:
// No seu componente:
const handleExportPDF = async () => {
  try {
    // Você pode verificar permissões para compartilhamento se quiser, mas não é obrigatório com expo-print
    
    // Gera o PDF e compartilha
    await captureViewAsPDF(null, 'relatorio_estatisticas', {
      startDate,
      endDate,
      data,
      estatisticas: {
        temperature: tempStats,
        humidity: humidityStats
      },
      
    });
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    Alert.alert('Erro', 'Não foi possível gerar o PDF');
  }
};


  // Renderização condicional
  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Carregando dados...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Erro ao carregar dados: {error}</Text>
      </View>
    );
  }

  return (

    <ScrollView style={styles.container}>
      <Text style={styles.title}>Estatísticas dos Galpões</Text>
      
      {/* Seletor de Galpão */}
      <View style={styles.pickerContainer}>

      <Text style={{ marginBottom: 8 }}>Selecione o Galpão:</Text>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={<Button mode="outlined" onPress={openMenu}>{selectedWarehouse}</Button>}
      >
        <Menu.Item onPress={() => handleSelect('Todos os Galpões')} title="Todos os Galpões" />
        <Menu.Item onPress={() => handleSelect('Galpão Sul - Lote 15')} title="Galpão Sul - Lote 15" />
        <Menu.Item onPress={() => handleSelect('Galpão Base - Lote 02')} title="Galpão Base - Lote 02" />
        <Menu.Item onPress={() => handleSelect('Galpão Sudeste - Lote 68')} title="Galpão Sudeste - Lote 68" />
      </Menu>
    </View>
     
      
      {/* Seletores de Data */}
    {/* Seletores de Data */}

  <View style={styles.dateContainer}>
    <View style={styles.dateInput}>
      <Text style={styles.label}>Data Inicial:</Text>
      <TouchableOpacity 
        style={styles.dateButton}
        onPress={() => setShowStartDatePicker(true)}
      >
        <Text>{formatDate(startDate)}</Text>
      </TouchableOpacity>
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={onStartDateChange}
          maximumDate={new Date()} // Não permite datas futuras
        />
      )}
    </View>

    <View style={styles.dateInput}>
      <Text style={styles.label}>Data Final:</Text>
      <TouchableOpacity 
        style={styles.dateButton}
        onPress={() => setShowEndDatePicker(true)}
      >
        <Text>{formatDate(endDate)}</Text>
      </TouchableOpacity>
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={onEndDateChange}
          maximumDate={new Date()} // Não permite datas futuras
        />
      )}
    </View>
  </View>

  {/* Botão para resetar para o período padrão */}
  <TouchableOpacity 
    style={styles.resetButton}
    onPress={() => {
      setStartDate(getDefaultStartDate());
      setEndDate(new Date());
    }}
  >
    <Text style={styles.resetButtonText}>Usar Período Padrão (últimos 10 dias)</Text>
  </TouchableOpacity>

  {/* Resumo Estatístico */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}> 📊 Resumo Estatístico</Text>
    <Text>Período: {formatDate(startDate)} até {formatDate(endDate)}</Text>
    <Text>Galpão: {selectedWarehouse}</Text>
    <Text>Total de registros: {data.length}</Text>
  </View>

  {/* Estatísticas de Temperatura */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}> 🌡️  Temperatura (°C)</Text>
    <View style={styles.statsGrid}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{tempStats.average ? tempStats.average.toFixed(2) : 'N/A'}</Text>
        <Text style={styles.statLabel}>  🔢 Média</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{tempStats.min ? tempStats.min.toFixed(2) : 'N/A'}</Text>
        <Text style={styles.statLabel}> ❄️ Mínima</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{tempStats.max ? tempStats.max.toFixed(2) : 'N/A'}</Text>
        <Text style={styles.statLabel}> 🔥 Máxima</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{tempStats.median ? tempStats.median.toFixed(2) : 'N/A'}</Text>
        <Text style={styles.statLabel}> ➗ Mediana</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{tempStats.stdDev ? tempStats.stdDev.toFixed(2) : 'N/A'}</Text>
        <Text style={styles.statLabel}> 📈 Desvio Padrão</Text>
      </View>
    </View>
  </View>

  {/* Estatísticas de Umidade */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}> 💧 Umidade (%)</Text>
    <View style={styles.statsGrid}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{humidityStats.average ? humidityStats.average.toFixed(2) : 'N/A'}</Text>
        <Text style={styles.statLabel}>  🔢 Média</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{humidityStats.min ? humidityStats.min.toFixed(2) : 'N/A'}</Text>
        <Text style={styles.statLabel}> ❄️ Mínima</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{humidityStats.max ? humidityStats.max.toFixed(2) : 'N/A'}</Text>
        <Text style={styles.statLabel}> 🔥 Máxima</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{humidityStats.median ? humidityStats.median.toFixed(2) : 'N/A'}</Text>
        <Text style={styles.statLabel}> ➗ Mediana</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{humidityStats.stdDev ? humidityStats.stdDev.toFixed(2) : 'N/A'}</Text>
        <Text style={styles.statLabel}> 📈 Desvio Padrão</Text>
      </View>
    </View>
  </View>


      {/* Gráficos */}
        <ScrollView>
      {dailyData.length > 0 && (
        <>
          {/* Gráfico de Temperatura Diária */}
          <View style={{ marginVertical: 16 }} >
            <Text style={styles.sectionTitle}>Variação Diária de Temperatura</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <LineChart
      data={chartData}
      width={Math.max(screenWidth, chartData.labels.length * 60)}
      height={260}
      yAxisSuffix="ºC"
      chartConfig={{
        backgroundGradientFrom: '#fff',
        backgroundGradientTo: '#fff',
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // cor da linha
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      }}
      bezier
      onDataPointClick={({ value, x, y }) => {
        setTooltipPos({ visible: true, x, y, value });
        setTimeout(() => setTooltipPos({ ...tooltipPos, visible: false }), 2000);
      }}
      decorator={() => (
        tooltipPos.visible ? (
          <View style={{
            position: 'absolute',
            top: tooltipPos.y - 40,
            left: tooltipPos.x - 20,
            backgroundColor: 'rgba(33, 150, 243, 0.9)',
            padding: 6,
            borderRadius: 6,
          }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>{tooltipPos.value.toFixed(1)}ºC</Text>
          </View>
        ) : null
      )}
      style={{ borderRadius: 8 }}
    />
            </ScrollView>
          </View>

            {/* Gráfico de Umidade Diária */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Variação Diária de Umidade</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <LineChart
                data={{
                  labels: dailyData.map(item => item.date.split('-')[2]),
                  datasets: [{
                    data: dailyData.map(item => item.avgHumidity),
                    color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
                    strokeWidth: 2
                  }]
                }}
                width={Math.max(screenWidth, dailyData.length * 50)}
                height={220}
                chartConfig={humidityChartConfig}
                bezier
                style={styles.chart}
              />
            </ScrollView>
          </View>

           {/* Gráfico de Distribuição de Temperaturas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distribuição de Temperaturas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <BarChart
                data={{
                  labels: ['<15°', '15-20°', '20-25°', '25-30°', '>30°'],
                  datasets: [{
                    data: [
                      data.filter(item => item.temperature < 15).length,
                      data.filter(item => item.temperature >= 15 && item.temperature < 20).length,
                      data.filter(item => item.temperature >= 20 && item.temperature < 25).length,
                      data.filter(item => item.temperature >= 25 && item.temperature < 30).length,
                      data.filter(item => item.temperature >= 30).length,
                    ]
                  }]
                }}
                width={Math.max(screenWidth, 5 * 80)} // 5 categorias * 80px cada
                height={220}
                chartConfig={barChartConfig}
                style={styles.chart}
                fromZero
              />
            </ScrollView>
          </View>

         {/* Gráfico de Temperatura por Hora (exemplo adaptado) */}
<View style={{ marginVertical: 16 }}>
  <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>
    🌡️ Temperatura Média por Hora
  </Text>
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    <LineChart
      data={{
        labels: hourlyAverages.map(item => `${item.hour}h`),
        datasets: [{ data: hourlyAverages.map(item => parseFloat(item.tempAvg.toFixed(1))) }],
        yAxisSuffix: 'ºC',
      }}
      width={Math.max(screenWidth, hourlyAverages.length * 60)}
      height={260}
      chartConfig={{
        backgroundGradientFrom: '#fff',
        backgroundGradientTo: '#fff',
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(255, 87, 51, ${opacity})`, // Cor laranja
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      }}
      bezier
      onDataPointClick={({ value, x, y }) => {
        setTooltipPos({ visible: true, x, y, value });
        setTimeout(() => setTooltipPos({ ...tooltipPos, visible: false }), 2000);
      }}
      decorator={() => (
        tooltipPos.visible ? (
          <View style={{
            position: 'absolute',
            top: tooltipPos.y - 40,
            left: tooltipPos.x - 20,
            backgroundColor: 'rgba(255, 87, 51, 0.9)',
            padding: 6,
            borderRadius: 6,
          }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>{tooltipPos.value.toFixed(1)}ºC</Text>
          </View>
        ) : null
      )}
      style={{ borderRadius: 8 }}
    />
  </ScrollView>
</View>

         <View style={styles.section}>
        <Text style={styles.sectionTitle}>Temperatura Média por Dia</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={{
              labels: dailyAverages.map(item => formatDateLabel(item.dateStr)),
              datasets: [{ data: dailyAverages.map(item => parseFloat(item.tempAvg.toFixed(1))) }],
              yAxisSuffix: 'ºC',
            }}
            width={Math.max(screenWidth, dailyAverages.length * 50)}
            height={260}
            chartConfig={tempChartConfig}
            bezier
            style={styles.chart}
          />
        </ScrollView>
      </View>

  
{/* Gráfico de Umidade por Hora (exemplo com cor azul) */}
<View style={{ marginVertical: 16 }}>
  <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>
    💧 Umidade Média por Hora
  </Text>
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    <LineChart
      data={{
        labels: hourlyAverages.map(item => `${item.hour}h`),
        datasets: [{ data: hourlyAverages.map(item => parseFloat(item.humidityAvg.toFixed(1))) }],
        yAxisSuffix: '%',
      }}
      width={Math.max(screenWidth, hourlyAverages.length * 60)}
      height={260}
      chartConfig={{
        backgroundGradientFrom: '#fff',
        backgroundGradientTo: '#fff',
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(51, 153, 255, ${opacity})`, // Cor azul
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      }}
      bezier
      onDataPointClick={({ value, x, y }) => {
        setTooltipPos({ visible: true, x, y, value });
        setTimeout(() => setTooltipPos({ ...tooltipPos, visible: false }), 2000);
      }}
      decorator={() => (
        tooltipPos.visible ? (
          <View style={{
            position: 'absolute',
            top: tooltipPos.y - 40,
            left: tooltipPos.x - 20,
            backgroundColor: 'rgba(51, 153, 255, 0.9)',
            padding: 6,
            borderRadius: 6,
          }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>{tooltipPos.value.toFixed(1)}%</Text>
          </View>
        ) : null
      )}
      style={{ borderRadius: 8 }}
    />
  </ScrollView>
</View>
          {/* Gráfico de Umidade por Dia */}
          <View style={styles.section}>
           <Text style={styles.sectionTitle}>Umidade Média por Dia</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={{
              labels: dailyAverages.map(item => formatDateLabel(item.dateStr)),
              datasets: [{ data: dailyAverages.map(item => parseFloat(item.humidityAvg.toFixed(1))) }],
              yAxisSuffix: '%',
            }}
            width={Math.max(screenWidth, dailyAverages.length * 50)}
            height={260}
            chartConfig={humidityChartConfig}
            bezier
            style={styles.chart}
          />
        </ScrollView>
          </View>

          {/* Botões para modais adicionais */}


{/* Gráficos adicionais */}
<View style={{ marginVertical: 16 }}>
  <Text style={styles.sectionTitle}>Correlação Temperatura × Umidade</Text>
  <CorrelationScatterChart filteredData={data} />
</View>

<View style={{ marginVertical: 16 }}>
  <Text style={styles.sectionTitle}>Temperatura por Hora do Dia</Text>
  <ScatterTempHorarioChart filteredData={data} />
</View>

   <ViewShot ref={chartRef} options={{ format: 'png', quality: 0.9 }}>
        {/* Gráficos e Componentes que serão incluídos no PDF */}
      
    <View  style={{ marginVertical: 16 }}>
 
  <ForecastModal temperatureData={data} /> 
  <ForecastGrafico temperatureData={data} />
  
</View>
      </ViewShot>

    
<TouchableOpacity 
  style={styles.modalButton}
  onPress={() => setShowStatsModal(true)}
>
  <Text style={styles.modalButtonText}> 📊 Estatísticas Detalhadas</Text>
</TouchableOpacity>
  <StatsModal 
      visible={showStatsModal} 
      onClose={() => setShowStatsModal(false)} 
      estatisticas={estatisticas} 
    />
    <TouchableOpacity 
  style={styles.modalButton}
  onPress={() => setShowDailyModal(true)}
>
  <Text style={styles.modalButtonText}> 📅 Médias Diárias</Text>
</TouchableOpacity>
  <TouchableOpacity 
    style={styles.modalButton}
    onPress={() => setShowClassificationModal(true)}
  >
    <Text style={styles.modalButtonText}> 🌡️ Classificação de Temperatura</Text>
  </TouchableOpacity>
  
  <TouchableOpacity 
    style={styles.modalButton}
    onPress={() => setShowHourlyModal(true)}
  >
    <Text style={styles.modalButtonText}> ⏱️ Médias por Hora</Text>
  </TouchableOpacity>

{/* Modais */}
<ClassificationModal 
  visible={showClassificationModal} 
  onClose={() => setShowClassificationModal(false)} 
  data={getTemperatureClassificationData()} 
/>

<HourlyModal 
  visible={showHourlyModal} 
  onClose={() => setShowHourlyModal(false)} 
  hourlyAverages={getHourlyAverages()} 
/>
<DailyModal 
  visible={showDailyModal} 
  onClose={() => setShowDailyModal(false)} 
  dailyAverages={getDailyAverages()} 
/>
        </>
        
          
      )}
        </ScrollView>
 <TouchableOpacity 
  style={[styles.modalButton, styles.pdfButton]} // Adicione uma classe específica para o PDF
  onPress={handleExportPDF}
>
  <Text style={styles.modalButtonText}>📄 Exportar PDF</Text>
</TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingBottom: 30,
    
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  pickerContainer: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    elevation: 2,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  dateContainer: {
     flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    gap: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  dateInput: {
    width: '48%',flex: 1,
  },
  dateButton: {
     backgroundColor: '#E0E7FF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderColor: '#C7D2FE',
    borderWidth: 1,
  },
  resetButton: {
     backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 12,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1E3A8A',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statItem: {
    width: '30%',
    marginBottom: 10,
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  }, chartContainer: {
    height: 220,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  insight: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#fff8e1',
    borderRadius: 4,
  },buttonRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 16,
},
modalButton: {
  backgroundColor: '#4a90e2',
  padding: 12,
  borderRadius: 8,
  width: '48%',
  alignItems: 'center',
},
modalButtonText: {
  color: 'white',
  fontWeight: 'bold',
  textAlign: 'center',
},
modalButton: {
  backgroundColor: '#4a90e2',
  padding: 12,
  borderRadius: 8,
  marginBottom: 10,
  alignItems: 'center',
},
modalButtonText: {
  color: 'white',
  fontWeight: 'bold',
},pdfButton: {
    backgroundColor: '#e74c3c', // Vermelho mais vibrante
    marginTop: 20,
    paddingVertical: 15,
    elevation: 5, // Sombra no Android
    shadowColor: '#000', // Sombra no iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default StatisticsPage;
const escapeHtml = (unsafe) =>
  String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");