//Previsão para os ´proximos dias  
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Ionicons from 'react-native-vector-icons/Ionicons';

const WeatherDashboard = ({ sensorData }) => {
  const screenWidth = Dimensions.get('window').width;

  // Processa os dados para o formato necessário
  const processData = (rawData) => {
    if (!rawData || rawData.length === 0) return null;

    const sortedData = [...rawData].sort((a, b) =>
      new Date(a.datetime) - new Date(b.datetime)
    );

    const hourlyData = [];
    const dailyData = [];
    const daysMap = {};

    sortedData.forEach(item => {
      const date = new Date(item.datetime);
      const hour = date.getHours();
      const dayKey = date.toISOString().split('T')[0];

      if (!hourlyData[hour] || new Date(hourlyData[hour].datetime) < date) {
        hourlyData[hour] = {
          time: `${hour}:00`,
          temp: item.temperature,
          humidity: item.humidity,
          datetime: item.datetime
        };
      }

      if (!daysMap[dayKey]) {
        daysMap[dayKey] = {
          dateStr: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()],
          tempMax: item.temperature,
          tempMin: item.temperature,
          humidity: item.humidity,
          date: dayKey
        };
      } else {
        if (item.temperature > daysMap[dayKey].tempMax) {
          daysMap[dayKey].tempMax = item.temperature;
        }
        if (item.temperature < daysMap[dayKey].tempMin) {
          daysMap[dayKey].tempMin = item.temperature;
        }
      }
    });

    const filteredHourly = hourlyData.filter(Boolean).slice(-24);
    const filteredDaily = Object.values(daysMap).slice(-7);

    return {
      location: sortedData[0].local_name,
      current: {
        temp: sortedData[sortedData.length - 1].temperature,
        humidity: sortedData[sortedData.length - 1].humidity,
        datetime: sortedData[sortedData.length - 1].datetime,
        hourly: filteredHourly
      },
      daily: filteredDaily
    };
  };

  // Agora processa os dados antes de qualquer uso
  const processedData = processData(sensorData);

  // Verifica se os dados já foram processados
  if (!processedData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e88e5" />
        <Text>Carregando dados dos sensores...</Text>
      </View>
    );
  }

  // Agora sim é seguro acessar processedData
  const hourlyLabels = processedData.current.hourly.map(h => h.time);
  const hourlyTemps = processedData.current.hourly.map(h => h.temp);
  const filteredLabels = hourlyLabels.map((label, i) => (i % 3 === 0 ? label : ''));

  const chartData = {
    labels: processedData.daily.map(d => d.dateStr),
    datasets: [
      {
        data: processedData.daily.map(d => d.tempMax),
        color: (opacity = 1) => `rgba(255, 59, 48, ${opacity})`, // vermelho
        strokeWidth: 2
      },
      {
        data: processedData.daily.map(d => d.tempMin),
        color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`, // azul
        strokeWidth: 2
      }
    ],
  };


  const chartConfig = {
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
    },
  };
  const renderTrendIndicator = () => {
    const temps = processedData.current.hourly.map(h => h.temp);
    const first = temps[0];
    const last = temps[temps.length - 1];
    const isRising = last > first;
    
    return (
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginLeft: 8 
      }}>
        <Ionicons 
          name={isRising ? "trending-up" : "trending-down"} 
          size={20} 
          color={isRising ? "#34a853" : "#ea4335"} 
        />
        <Text style={{ 
          color: isRising ? "#34a853" : "#ea4335",
          marginLeft: 4,
          fontSize: 14
        }}>
          {Math.abs(last - first).toFixed(1)}°
        </Text>
      </View>
    );
  };
  return (
    <ScrollView style={styles.container}>
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Variação Diária (Máx/Mín)</Text>
        <LineChart
          data={chartData}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          yAxisSuffix="°C"
          fromZero={false}
        />
      </View>


      <Text style={styles.sectionTitle}>Leituras por Hora</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.header]}>Hora</Text>
            {processedData.current.hourly.map((hour, i) => (
              <Text key={i} style={[styles.cell, styles.header]}>{hour.time}</Text>
            ))}
          </View>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.header]}>Temp</Text>
            {processedData.current.hourly.map((hour, i) => (
              <Text
                key={i}
                style={[
                  styles.cell,
                  hour.temp > 25 ? styles.hot : hour.temp < 15 ? styles.cold : styles.normal
                ]}
              >
                {Math.round(hour.temp)}°
              </Text>
            ))}
          </View>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.header]}>Umidade</Text>
            {processedData.current.hourly.map((hour, i) => (
              <Text
                key={i}
                style={[
                  styles.cell,
                  hour.humidity > 70 ? styles.humid : styles.normal
                ]}
              >
                {Math.round(hour.humidity)}%
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>


      <Text style={styles.sectionTitle}>Resumo Diário</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.header]}>Dia</Text>
            {processedData.daily.map((day, i) => (
              <Text key={i} style={[styles.cell, styles.header]}>{day.dateStr}</Text>
            ))}
          </View>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.header]}>Máx</Text>
            {processedData.daily.map(day => (
              <Text
                key={day.date} // Aqui date é a string ISO yyyy-mm-dd, deve ser única
                style={[styles.cell, styles.hot]}
              >
                {Math.round(day.tempMax)}°
              </Text>
            ))}
          </View>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.header]}>Mín</Text>
            {processedData.daily.map((day, i) => (
              <Text key={i} style={[styles.cell, styles.cold]}>{Math.round(day.tempMin)}°</Text>
            ))}
          </View>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.header]}>Umidade</Text>
            {processedData.daily.map((day, i) => (
              <Text key={i} style={[styles.cell, day.humidity > 70 ? styles.humid : styles.normal]}>
                {Math.round(day.humidity)}%
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#E5F1EB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',

  },
  location: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  currentTemp: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 16,
  },
  currentDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#5f6368',
    marginBottom: 8,
    paddingLeft: 4,
  },
  chartStyle: {
    borderRadius: 8,
    paddingRight: 16,
  },
  chart: {
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    
  },
  table: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
    backgroundColor: '#E1F2E1',
  },
  cell: {
    width: 60,
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 6,
  },
  header: {
    fontWeight: 'bold',
    color: '#000',
  },
  hot: {
    color: '#e53935',
    fontWeight: '500',
  },
  cold: {
    color: '#1e88e5',
    fontWeight: '500',
  },
  normal: {
    color: '#333',
  },
  humid: {
    color: '#4caf50',
    fontWeight: '500',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: '#888',
  },
  location: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5f6368',
    marginBottom: 4,
  },
  
});

export default WeatherDashboard;