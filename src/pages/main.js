import React, { Component, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LineChart } from "react-native-chart-kit";
import { View, Text, Image, TouchableOpacity, Dimensions } from "react-native";
import { StyleSheet } from "react-native";
import { SafeAreaView } from 'react-native';


import { ScrollView } from 'react-native';
import { getWeather } from "../services/weather";

const screenWidth = Dimensions.get("window").width;

export default function HomeScreen() {
  const [temperature, setTemperature] = useState('--');
  const [humidity, setHumidity] = useState('--');
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{ data: [], color: () => "#FFA500", strokeWidth: 3 }],
  });

  useEffect(() => {
    async function fetchData() {
      const data = await getWeather(-20.5386, -47.4009); // Franca-SP
      if (data && data.data_day) {
        const temp = data.data_day.temperature_max[0];
        const hum = data.data_day.relative_humidity_mean[0];
        setTemperature(`${temp}ºC`);
        setHumidity(`${hum}%`);

        // Exemplo de dados para o gráfico
        const labels = ["9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];
        const dataset = [19.0, 20.0, 21.0, 22.5, 21.0, 23.0, 24.0];

        // valida os dados antes de setar
        if (dataset.every(item => typeof item === 'number' && isFinite(item))) {
          setChartData({
            labels: labels,
            datasets: [{ data: dataset, color: () => "#FFA500", strokeWidth: 3 }],
          });
        }
        
      }
    }
    fetchData();
  }, []);

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: () => "#FFA500",
    labelColor: () => "#888",
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#fff",
    },
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
    
        <Text style={styles.headerText}>Home</Text>
        <Image
          source={{ uri: 'https://i.imgur.com/0y0y0y0.png' }} // exemplo
          style={styles.avatar}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <View style={styles.card}>
            <Text style={styles.label}>Temperatura</Text>
            <Text style={styles.value}>☀️ {temperature}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.label}>Umidade</Text>
            <Text style={styles.value}>💧 {humidity}</Text>
          </View>
          <View style={styles.alertCard}>
            <Text style={styles.label}>Alertas</Text>
            <Text style={styles.alertText}>🔴 Temperatura elevada</Text>
            <Text style={styles.alertText}>🔴 Sensor com aquecimento</Text>
          </View>
        </View>

        <Text style={styles.graphTitle}>Sensor pasto 1</Text>
        <Image source={require('../pages/img/tempe.jpg')} style={styles.image} />

        {chartData.datasets[0].data.length > 0 && (
  <LineChart
    data={chartData}
    width={screenWidth * 0.9}
    height={220}
    chartConfig={chartConfig}
    style={styles.chart}
  />
)}


        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>Variação diária: 15,3 ºC</Text>
          <Text style={styles.summaryText}>Mínima registrada: 13,3 ºC</Text>
          <Text style={styles.summaryText}>Máxima registrada: 35,3 ºC</Text>
        </View>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>RELATÓRIOS</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5F1EB',
  },
  header: {
    backgroundColor: '#6B4EFF',
    paddingVertical: 16,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    width: screenWidth * 0.4,
    margin: 5,
    alignItems: 'center',
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    width: screenWidth * 0.85,
    marginVertical: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  alertText: {
    fontSize: 14,
    color: '#C62828',
    marginTop: 4,
  },
  image: {
    width: 350,
    height: 280,
    borderRadius: 12,
  },
  summaryBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    width: screenWidth * 0.9,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#444',
  },
  button: {
    backgroundColor: "#7159c1",
    borderRadius: 10,
    padding: 12,
    width: "80%",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  })