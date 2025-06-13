import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  ScrollView,
  Button,
  Text,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { styles } from '../components/Relatorios/Relatorios.styles';
import ViewShot from 'react-native-view-shot';
import { Provider as PaperProvider } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';


// Componentes modais e de gráfico
import StatsModal from '../components/Relatorios/StatsModal';
import ForecastModal from '../components/Relatorios/ForecastModal';
import ClassificationModal from '../components/Relatorios/ClassificationModal';
import HourlyModal from '../components/Relatorios/HourlyModal';
import DailyModal from '../components/Relatorios/DailyModal';
import CorrelationScatterChart from '../components/Relatorios/CorrelationScatterChart';
import ScatterTempHorarioChart from '../components/Relatorios/ScatterTempHorarioChart';
import TemperaturaHorarioChart from '../components/Relatorios/TemperaturaHorarioChart';
import LineChartComponent from '../components/Charts/LineChartComponent';
import SeletorDeData from '../components/Relatorios/SeletorDeData';
import EstatisticasScreen from '../components/Relatorios/EstatisticasScreen';

// Utilitários
import { calcularEstatisticas } from '../utils/relatorios/statistics';
import { gerarPrevisao } from '../utils/relatorios/forecast';
import { calcularMediasHora, calcularMediasDiarias } from '../utils/relatorios/aggregations';
import { captureViewAsPDF } from '../utils/relatorios/pdfUtils';
import { ApiRoutes } from '../config/api';
const warehouses = [
  'Todos os Galpões',
  'Galpão Sul - Lote 15',
  'Galpão Base - Lote 02',
  'Galpão Sudeste - Lote 68',
];

const Relatorios = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Estados
  const [data, setData] = useState([]);
  const [dados, setDados] = useState([]);
  const [sensorData, setSensorData] = useState([]);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState({
    inicio: new Date().toISOString().split('T')[0],
    fim: new Date().toISOString().split('T')[0]
  });
  const [modalStats, setModalStats] = useState(false);
  const [modalForecast, setModalForecast] = useState(false);
  const [modalHourly, setModalHourly] = useState(false);
  const [modalDaily, setModalDaily] = useState(false);
  const [modalClassificacao, setModalClassificacao] = useState(false);
  const [warehouses, setWarehouses] = useState(['Todos os Galpões']);
  const [selectedWarehouse, setSelectedWarehouse] = useState('Todos os Galpões');
  const [classificationRaw, setClassificationRaw] = useState([]);
  const chartRef = useRef();
const [showOptions, setShowOptions] = useState(false);

  function handleSelect(item) {
    setSelectedWarehouse(item);
    setShowOptions(false);
  }
 const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

 
  // Buscar lista de galpões disponíveis
  useEffect(() => {
    const fetchWarehouses = async (warehouse) => {
      setLoading(true);
      try {
        const response = await fetch(ApiRoutes.base());
        const data = await response.json();
        const uniqueWarehouses = [...new Set(data.map(item => item.local_name))];
        setWarehouses(['Todos os Galpões', ...uniqueWarehouses]);
        
        // Se veio da main com um galpão selecionado, usa esse
    
        if (!warehouse && uniqueWarehouses.length > 0) {
          warehouse = uniqueWarehouses[0];
          setSelectedWarehouse(warehouse);
        } const filteredData = warehouse === "Todos os Galpões"
        ? data
        : data.filter(item => item.local_name === warehouse);
  
      if (filteredData.length === 0) {
        console.warn('Nenhum dado encontrado para o galpão selecionado');
        setDados([]);
        return;
      }
  
      setSensorData(filteredData);
      } catch (error) {
        console.error('Erro ao buscar galpões:', error);
        setWarehouses(['Todos os Galpões', 'Galpão Sul - Lote 15', 'Galpão Base - Lote 02', 'Galpão Sudeste - Lote 68']);
      }
    };
    fetchWarehouses();
  }, []);

  // Buscar dados da API
 useEffect(() => {
  const fetchData = async (warehouse) => {
    setLoading(true);
    try {
      if (!periodo || !periodo.inicio || !periodo.fim) {
        console.warn("Período inválido, não foi possível buscar os dados.");
        setLoading(false);
        return;
      }

      const startDate = new Date(periodo.inicio);
      const endDate = new Date(periodo.fim);
      const today = new Date(); // ✅ Definindo "hoje"

      if (startDate > endDate) {
        Alert.alert("Erro", "A data final deve ser maior ou igual à data inicial");
        setLoading(false);
        return;
      }

  let url = ApiRoutes.byPeriod(periodo.inicio, periodo.fim);

if (warehouse && warehouse !== 'Todos os Galpões') {
  url += `&local_name=${encodeURIComponent(warehouse)}`;
}

const response = await axios.get(url);


      const res = await fetch(url);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Erro na API: ${res.status} - ${errorText}`);
      }

      const json = await res.json();

      // ✅ Processa os dados recebidos
      const processedData = json
        .map(item => ({
          ...item,
          datetime: new Date(item.datetime),
          temperature: parseFloat(item.temperature),
          humidity: parseFloat(item.humidity),
        }))
        .filter(item => item.datetime <= today); // Só dados até agora

      if (processedData.length === 0) {
        console.warn('⚠️ Nenhum dado encontrado para o filtro atual.');
      }

      setSensorData(json);
      setData(processedData);

      // ✅ Filtra os dados pelo galpão selecionado
      const dadosFiltrados = warehouse === 'Todos os Galpões'
        ? processedData
        : processedData.filter(item => item.local_name === warehouse);

      // ✅ Chamada para combinar dados
      const combinado = combinarDados(dadosFiltrados);
      setDados(combinado);

      // ✅ Classificação das temperaturas
      const contagem = { Frio: 0, Agradável: 0, Quente: 0 };
      combinado.forEach(item => {
        if (item.temperature !== null) {
          if (item.temperature < 15) contagem.Frio++;
          else if (item.temperature <= 25) contagem.Agradável++;
          else contagem.Quente++;
        }
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
      Alert.alert('Erro', `Falha ao carregar dados: ${error.message}. Verifique a conexão ou o servidor.`);
    } finally {
      setLoading(false);
    }
  };

  fetchData(selectedWarehouse); // Chama a função com warehouse selecionado (ou o que estiver usando)
}, [periodo, selectedWarehouse]);

  // Funções auxiliares
  function combinarDados(dataArray) {
    if (!Array.isArray(dataArray)) {
      console.warn("combinarDados: dataArray não é um array válido.");
      return [];
    }

    return dataArray.map((item, index) => ({
      datetime: item?.datetime || `Ponto ${index + 1}`,
      temperature: parseFloat(item?.temperature) || null,
      humidity: parseFloat(item?.humidity) || null,
      heatIndex: null,
    }));
  }

  function filtrarDadosPorPeriodo(dados, periodo) {
    if (!dados || !Array.isArray(dados) || !periodo || !periodo.inicio || !periodo.fim) {
      return [];
    }
    const inicio = new Date(`${periodo.inicio}T00:00:00Z`); // Força UTC
    const fim = new Date(`${periodo.fim}T23:59:59Z`);

    return dados.filter(item => {
      const dataItem = new Date(item.datetime);
      return !isNaN(dataItem.getTime()) && dataItem >= inicio && dataItem <= fim;
    });
  }

  // Memorização de cálculos
  const estatisticas = useMemo(() => calcularEstatisticas(dados), [dados]);
  const forecastMemo = useMemo(() => gerarPrevisao(dados), [dados]);
  const hourlyAverages = useMemo(() => calcularMediasHora(dados), [dados]);
  const dailyAverages = useMemo(() => calcularMediasDiarias(dados), [dados]);

  const categoryColors = {
    Frio: '#00f',
    Agradável: '#0f0',
    Quente: '#f00',
  };

  const orderedCategories = ['Frio', 'Agradável', 'Quente'];

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

  // Função para Exportar PDF
 // No seu componente:
const handleExportPDF = async () => {
  try {
    if (chartRef.current) {
      await captureViewAsPDF(chartRef.current, 'relatorio_estatisticas', {
        startDate,
        endDate,
        data, // seus dados filtrados
        estatisticas: { // suas estatísticas calculadas
          temperature: tempStats,
          humidity: humidityStats
        },
        forecast: forecastMemo // seus dados de previsão
      });
    }
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    Alert.alert('Erro', 'Não foi possível gerar o PDF');
  }
};

  // Renderização condicional (Loading)
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Carregando dados...</Text>
      </View>
    );
  }

  // Dados e Configurações para o Gráfico de Linha
  if (dailyAverages.length === 0 && !loading) {
    return (
      <View style={{ padding: 20, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, textAlign: 'center' }}>
          Nenhum dado encontrado para o período selecionado. Tente ajustar as datas.
        </Text>
        <View style={{ marginTop: 20, width: '100%' }}>
          <SeletorDeData periodo={periodo} onPeriodoSelecionado={setPeriodo} />
        </View>
      </View>
    );
  }

  const tempChartData = {
    labels: dailyAverages.map(d => d.dateStr),
    datasets: [
      {
        data: dailyAverages.map(d => {
          const v = parseFloat(d.tempAvg);
          return Number.isFinite(v) ? v : 0; // ou null, dependendo do gráfico
        }),
        color: (opacity = 1) => `rgba(255, 87, 51, ${opacity})`,
        strokeWidth: 2,
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
        <PaperProvider>
          <EstatisticasScreen filteredData={dados} />
        </PaperProvider>
    </ScrollView>

    
  );
};


export default Relatorios;