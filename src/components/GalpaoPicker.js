import React, { useState, useEffect } from 'react';
import { View, Text, Button, Platform, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Modal, Pressable } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions, ScrollView } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import axios from 'axios';

import { ApiRoutes } from '../config/api';
const SCREEN_WIDTH = Dimensions.get('window').width;

const galpoes = [
  "Galpão Sul - Lote 15",
  "Galpão Base - Lote 02",
  "Galpão Sudeste - Lote 68"
];

// Função auxiliar para calcular estatísticas
function calcStats(values) {
  if (!values.length) return null;
  const n = values.length;
  const mean = values.reduce((a,b) => a+b, 0) / n;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const variance = values.reduce((a,b) => a + (b - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);
  return { mean, min, max, stdDev };
}

export default function Estatisticas() {
  const [data, setData] = useState([]);
  const [galpao, setGalpao] = useState(galpoes[0]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  // Data hoje e 10 dias atrás para default
  const hoje = new Date();
  const dezDiasAtras = new Date();
  dezDiasAtras.setDate(hoje.getDate() - 10);

  // Função para buscar dados da API/simulação
  async function fetchData() {
    setLoading(true);

    // Usa datas selecionadas ou default
    const start = startDate || dezDiasAtras;
    const end = endDate || hoje;

    // Ajusta para o dia final: nunca data futura
    const finalEnd = end > hoje ? hoje : end;
    
    const url = ApiRoutes.byGalpaoAndDate(galpao, start, finalEnd);
    const response = await axios.get(url);
    try {
    
      const json = generateMockData(start, finalEnd, galpao);
      const filtered = json.filter(d => new Date(d.datetime) <= hoje);

      setData(filtered);
    } catch (error) {
      console.error(error);
      setData([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [galpao, startDate, endDate]);

  // Estatísticas
  const temps = data.map(d => Number(d.temperature));
  const hums = data.map(d => Number(d.humidity));
  const statsTemp = calcStats(temps);
  const statsHum = calcStats(hums);

  // Preparar dados para gráfico
  const labels = data.map(d => new Date(d.datetime).toLocaleDateString());
  const tempData = temps;
  const humData = hums;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 50}}>

      <Text style={styles.title}>Estatísticas do Galpão</Text>

      <View>
  <Text style={styles.label}>Selecione o Galpão:</Text>
  <TouchableOpacity 
    style={styles.selectorButton}
    onPress={() => setModalVisible(true)}
  >
    <Text>{galpao}</Text>
    <Ionicons name="chevron-down" size={20} color="#333" />
  </TouchableOpacity>

  <Modal
    animationType="slide"
    transparent={true}
    visible={modalVisible}
    onRequestClose={() => setModalVisible(false)}
  >
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Selecione um Galpão</Text>
        {galpoes.map((g) => (
          <Pressable
            key={g}
            style={styles.optionButton}
            onPress={() => {
              setGalpao(g);
              setModalVisible(false);
            }}
          >
            <Text style={g === galpao ? styles.selectedOption : styles.optionText}>{g}</Text>
          </Pressable>
        ))}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setModalVisible(false)}
        >
          <Text style={styles.closeButtonText}>Fechar</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
</View>

      {showStartPicker && (
        <DateTimePicker
          value={startDate || dezDiasAtras}
          mode="date"
          display="default"
          maximumDate={hoje}
          onChange={(e, date) => {
            setShowStartPicker(Platform.OS === 'ios');
            if (date) setStartDate(date);
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate || hoje}
          mode="date"
          display="default"
          maximumDate={hoje}
          onChange={(e, date) => {
            setShowEndPicker(Platform.OS === 'ios');
            if (date) setEndDate(date);
          }}
        />
      )}

      <Button title="Atualizar" onPress={fetchData} />

      {loading ? (
        <ActivityIndicator size="large" style={{marginTop: 20}} />
      ) : (
        <>
          <Text style={styles.subtitle}>Resumo Estatístico</Text>
          {statsTemp && statsHum ? (
            <>
              <Text>Temperatura (°C): Média {statsTemp.mean.toFixed(2)}, Min {statsTemp.min.toFixed(2)}, Max {statsTemp.max.toFixed(2)}, Desvio {statsTemp.stdDev.toFixed(2)}</Text>
              <Text>Umidade (%): Média {statsHum.mean.toFixed(2)}, Min {statsHum.min.toFixed(2)}, Max {statsHum.max.toFixed(2)}, Desvio {statsHum.stdDev.toFixed(2)}</Text>
            </>
          ) : (
            <Text>Sem dados para exibir.</Text>
          )}

          <Text style={styles.subtitle}>Gráfico de Temperatura</Text>
          {data.length > 0 && (
            <LineChart
              data={{
                labels,
                datasets: [
                  { data: tempData, color: () => 'rgba(255, 0, 0, 0.7)', strokeWidth: 2 }
                ]
              }}
              width={SCREEN_WIDTH - 20}
              height={220}
              yAxisSuffix="°C"
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
                labelColor: () => '#333',
                style: { borderRadius: 16 }
              }}
              style={{ marginVertical: 8, borderRadius: 16 }}
            />
          )}

          <Text style={styles.subtitle}>Gráfico de Umidade</Text>
          {data.length > 0 && (
            <LineChart
              data={{
                labels,
                datasets: [
                  { data: humData, color: () => 'rgba(0, 0, 255, 0.7)', strokeWidth: 2 }
                ]
              }}
              width={SCREEN_WIDTH - 20}
              height={220}
              yAxisSuffix="%"
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
                labelColor: () => '#333',
                style: { borderRadius: 16 }
              }}
              style={{ marginVertical: 8, borderRadius: 16 }}
            />
          )}
        </>
      )}

    </ScrollView>
  );
}

function generateMockData(start, end, galpao) {
  const data = [];
  const current = new Date(start);

  while (current <= end) {
    data.push({
      _id: Math.random().toString(36).substr(2, 9),
      datetime: current.toISOString(),
      temperature: (15 + Math.random() * 15).toFixed(Math.floor(Math.random()*3)),
      humidity: (50 + Math.random() * 50).toFixed(Math.floor(Math.random()*3)),
      local_name: galpao
    });
    current.setDate(current.getDate() + 1);
  }
  return data;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f7f7f7'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center'
  },
  label: {
    fontSize: 16,
    marginVertical: 10
  },
  piWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: '#fff'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  dateButton: {
    padding: 10,
    backgroundColor: '#ddd',
    borderRadius: 6,
    width: '48%'
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10
  }
});
