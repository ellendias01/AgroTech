import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, Button, Text, ActivityIndicator } from 'react-native';
import { styles } from '../components/Relatorios/Relatorios.styles';

import StatsModal from '../components/Relatorios/StatsModal';
import ForecastModal from '../components/Relatorios/ForecastModal';
import ClassificationModal from '../components/Relatorios/ClassificationModal';
import HourlyModal from '../components/Relatorios/HourlyModal';
import DailyModal from '../components/Relatorios/DailyModal';
import CorrelationScatterChart from '../components/Relatorios/CorrelationScatterChart';
import ScatterCorrelationChart from '../components/Relatorios/ScatterCorrelationChart';
import TemperaturaHorarioChart from '../components/Relatorios/TemperaturaHorarioChart';

import { calcularEstatisticas } from '../utils/relatorios/statistics';
import { gerarPrevisao } from '../utils/relatorios/forecast';
import {
  calcularMediasHora,
  calcularMediasDiarias,
  calcularPrimeirosDiarios,
} from '../utils/relatorios/aggregations';
import { handleCapture } from '../utils/relatorios/pdfUtils';
import { View } from 'react-native';
import { useRef } from 'react';

const Relatorios = () => {
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalStats, setModalStats] = useState(false);
  const [modalForecast, setModalForecast] = useState(false);
  const [modalHourly, setModalHourly] = useState(false);
  const [modalDaily, setModalDaily] = useState(false);
  const [modalClassificacao, setModalClassificacao] = useState(false);

  // Exemplo de fetch do seu back-end:
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/all'); // ou IP da sua máquina/servidor
        const json = await res.json();
  
        const dadosCombinados = json.datetime.map((_, i) => ({
          datetime: new Date(json.datetime[i].value), // ou json.datetime[i].data dependendo do schema
          temperature: json.temperature[i]?.temperatura || json.temperature[i]?.valor,
          humidity: json.humidity[i]?.value,
        }));
  
        setDados(dadosCombinados);
      } catch (error) {
        console.error('Erro ao buscar dados do back-end:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);
  
  const chartRef = useRef();

  const estatisticas = useMemo(() => calcularEstatisticas(dados), [dados]);
  const forecastData = useMemo(() => gerarPrevisao(dados), [dados]);
  const hourlyAverages = useMemo(() => calcularMediasHora(dados), [dados]);
  const dailyAverages = useMemo(() => calcularMediasDiarias(dados), [dados]);
  const classificacaoData = useMemo(() => {
    // lógica para classificação de temperatura
    return [
      { name: 'Alta', population: 10, color: '#ff6384', legendFontColor: '#000', legendFontSize: 12 },
      { name: 'Média', population: 20, color: '#ffcd56', legendFontColor: '#000', legendFontSize: 12 },
      { name: 'Baixa', population: 5, color: '#36a2eb', legendFontColor: '#000', legendFontSize: 12 },
    ];
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator style={styles.loader} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>📈 Relatórios Ambientais</Text>

      <Button title="📊 Ver Estatísticas" onPress={() => setModalStats(true)} />
      <Button title="🔮 Previsão 7 dias" onPress={() => setModalForecast(true)} />
      <Button title="⏱️ Médias por Hora" onPress={() => setModalHourly(true)} />
      <Button title="📅 Médias Diárias" onPress={() => setModalDaily(true)} />
      <Button title="🌡️ Classificação" onPress={() => setModalClassificacao(true)} />

      <TemperaturaHorarioChart filteredData={dados} />
      <CorrelationScatterChart filteredData={dados} />
      <ScatterCorrelationChart filteredData={dados} />

      <StatsModal visible={modalStats} onClose={() => setModalStats(false)} estatisticas={estatisticas} />
      <ForecastModal visible={modalForecast} onClose={() => setModalForecast(false)} forecastData={forecastData} />
      <HourlyModal visible={modalHourly} onClose={() => setModalHourly(false)} hourlyAverages={hourlyAverages} />
      <DailyModal visible={modalDaily} onClose={() => setModalDaily(false)} dailyAverages={dailyAverages} />
      <ClassificationModal visible={modalClassificacao} onClose={() => setModalClassificacao(false)} data={classificacaoData} />

      // No botão de exportar:
<Button title="📄 Exportar PDF" onPress={() => handleCapture(chartRef)} />

// Envolva o gráfico com:
<View ref={chartRef}>
  <TemperaturaHorarioChart filteredData={dados} />
</View>

    </ScrollView>
  );
};

export default Relatorios;
