import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, ScrollView, Button, Text, ActivityIndicator, Alert, Platform } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { styles } from '../components/Relatorios/Relatorios.styles';

import StatsModal from '../components/Relatorios/StatsModal';
import ForecastModal from '../components/Relatorios/ForecastModal';
import ClassificationModal from '../components/Relatorios/ClassificationModal';
import HourlyModal from '../components/Relatorios/HourlyModal';
import DailyModal from '../components/Relatorios/DailyModal';
import CorrelationScatterChart from '../components/Relatorios/CorrelationScatterChart';
import ScatterCorrelationChart from '../components/Relatorios/ScatterCorrelationChart';
import TemperaturaHorarioChart from '../components/Relatorios/TemperaturaHorarioChart';
import LineChartComponent from '../components/Charts/LineChartComponent';

import { calcularEstatisticas } from '../utils/relatorios/statistics';
import { gerarPrevisao } from '../utils/relatorios/forecast';
import { calcularMediasHora, calcularMediasDiarias } from '../utils/relatorios/aggregations';

import { captureViewAsPDF } from '../utils/relatorios/pdfUtils';

function combinarDados(dataArray) {
  return dataArray.map((item, index) => ({
    datetime: item.datetime || `Ponto ${index + 1}`,
    temperature: item.temperature ?? null,
    humidity: item.humidity ?? null,
    heatIndex: null,
  }));
}

const categoryColors = {
  Frio: '#00f',
  Agradável: '#0f0',
  Quente: '#f00',
};

const orderedCategories = ['Frio', 'Agradável', 'Quente'];

const Relatorios = () => {
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalStats, setModalStats] = useState(false);
  const [modalForecast, setModalForecast] = useState(false);
  const [modalHourly, setModalHourly] = useState(false);
  const [modalDaily, setModalDaily] = useState(false);
  const [modalClassificacao, setModalClassificacao] = useState(false);

  const [sensorData, setSensorData] = useState([]);
  const [classificationRaw, setClassificationRaw] = useState([]);

  const chartRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://192.168.100.7:8080/api/dados');
        const json = await res.json();

        const combinado = combinarDados(json);
        setDados(combinado);
        setSensorData(json);

        const contagem = { Frio: 0, Agradável: 0, Quente: 0 };
        combinado.forEach(item => {
          if (item.temperature < 15) contagem.Frio++;
          else if (item.temperature <= 25) contagem.Agradável++;
          else contagem.Quente++;
        });

        const classificacao = Object.entries(contagem).map(([categoria, quantidade]) => ({
          categoria,
          quantidade,
          temperatura:
            categoria === 'Frio'
              ? '<15°C'
              : categoria === 'Agradável'
                ? '15-25°C'
                : '≥25°C',
        }));

        setClassificationRaw(classificacao);
      } catch (error) {
        console.error('Erro ao buscar ou processar os dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const estatisticas = useMemo(() => calcularEstatisticas(dados), [dados]);
  const forecastMemo = useMemo(() => gerarPrevisao(dados), [dados]);
  const hourlyAverages = useMemo(() => calcularMediasHora(dados), [dados]);
  const dailyAverages = useMemo(() => calcularMediasDiarias(dados), [dados]);

  const classificacaoData = useMemo(() => {
    const mapa = {};
    classificationRaw.forEach(item => {
      mapa[item.categoria] = {
        name: `${item.categoria} (${item.temperatura})`,
        population: item.quantidade,
        color: categoryColors[item.categoria] || '#999',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      };
    });
    return orderedCategories.filter(c => mapa[c]).map(c => mapa[c]);
  }, [classificationRaw]);

  const handleExportPDF = async () => {
    try {
      if (!chartRef.current) {
        Alert.alert('Aviso', 'A referência do gráfico não está pronta');
        return;
      }

      const pdfPath = await captureViewAsPDF(chartRef, 'relatorio_clima');
      Alert.alert('Sucesso', `PDF gerado em:\n${pdfPath}`);

      // Para abrir o PDF diretamente:
      // import FileViewer from 'react-native-file-viewer';
      // await FileViewer.open(pdfPath);

    } catch (error) {
      Alert.alert('Erro', `Falha ao gerar PDF: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const tempChartData = {
    labels: dailyAverages.map(d => d.dateStr),
    datasets: [
      {
        data: dailyAverages.map(d => d.tempAvg),
        color: (opacity = 1) => `rgba(255, 87, 51, ${opacity})`,
      }
    ],
    yAxisSuffix: '°C',
  };

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>📈 Relatórios Ambientais</Text>

      <Button title="📊 Ver Estatísticas" onPress={() => setModalStats(true)} />
      <Button title="🔮 Previsão 7 dias" onPress={() => setModalForecast(true)} />
      <Button title="⏱️ Médias por Hora" onPress={() => setModalHourly(true)} />
      <Button title="📅 Médias Diárias" onPress={() => setModalDaily(true)} />
      <Button title="🌡️ Classificação" onPress={() => setModalClassificacao(true)} />

      {/* ENVOLVE TUDO EM ViewShot */}
      <ViewShot ref={chartRef} options={{ format: 'jpg', quality: 0.9 }}>
        <LineChartComponent data={tempChartData} title="📊 Temperatura Média Diária" config={chartConfig} />
        <TemperaturaHorarioChart filteredData={dados} />
        <CorrelationScatterChart filteredData={dados} />
        <ScatterCorrelationChart filteredData={dados} />
      </ViewShot>

      <Button title="📄 Exportar PDF" onPress={handleExportPDF} />

      <StatsModal visible={modalStats} onClose={() => setModalStats(false)} estatisticas={estatisticas} />
      <ForecastModal visible={modalForecast} onClose={() => setModalForecast(false)} forecastData={forecastMemo} />
      <HourlyModal visible={modalHourly} onClose={() => setModalHourly(false)} hourlyAverages={hourlyAverages} />
      <DailyModal visible={modalDaily} onClose={() => setModalDaily(false)} dailyAverages={dailyAverages} />
      <ClassificationModal visible={modalClassificacao} onClose={() => setModalClassificacao(false)} data={classificacaoData} />
    </ScrollView>
  );
};

export default Relatorios;
