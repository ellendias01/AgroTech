import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Alert
} from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LineChart } from "react-native-chart-kit";
import SmartAlertCard from "../components/Charts/SmartAlertCard";
import SummaryBox from "../components/SummaryBox";
import WeatherDashboard from '../components/Charts/WeatherDashboard';
import WeatherInfo from "../components/WeatherInfo";
import DropDownPicker from 'react-native-dropdown-picker';
import { ApiRoutes } from '../config/api';


const screenWidth = Dimensions.get("window").width;

export default function HomeScreen({ navigation }) {
  const [sensorData, setSensorData] = useState([]);
  const [processedData, setProcessedData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const chartRef = useRef(null);

  const fetchData = (warehouse) => {
    setRefreshing(true);
    fetch(ApiRoutes.base())
      .then((res) => res.json())
      .then((data) => {
        const uniqueWarehouses = [...new Set(data.map(item => item.local_name))];
        setWarehouses(uniqueWarehouses);
  
        if (!warehouse && uniqueWarehouses.length > 0) {
          warehouse = uniqueWarehouses[0];
          setSelectedWarehouse(warehouse);
        }
  
        const filteredData = warehouse === "Todos os Galpões"
          ? data
          : data.filter(item => item.local_name === warehouse);
  
        if (filteredData.length === 0) {
          console.warn('Nenhum dado encontrado para o galpão selecionado');
          return;
        }
  
        const newestDataDate = new Date(filteredData[0].datetime);
        const now = new Date();
  
        if (now - newestDataDate > 2 * 60 * 60 * 1000) {
          console.warn('Dados podem estar desatualizados');
        }
  
        setSensorData(filteredData);
        setProcessedData(processData(filteredData));
        setLastUpdated(new Date());
      })
      .catch((error) => {
        console.error("Erro ao buscar dados:", error);
        Alert.alert("Erro", "Não foi possível carregar os dados mais recentes");
      })
      .finally(() => setRefreshing(false));
  };
  

  useEffect(() => {
    fetchData(selectedWarehouse);
  
    const interval = setInterval(() => {
      fetchData(selectedWarehouse);
    }, 5 * 60 * 1000);
  
    return () => clearInterval(interval);
  }, [selectedWarehouse]);

  const processData = (rawData) => {
    if (!rawData || rawData.length === 0) return null;

    // Ordenar por data (mais recente primeiro)
    const sortedData = [...rawData].sort(
      (a, b) => new Date(b.datetime) - new Date(a.datetime)
    );

    // Filtrar apenas dados das últimas 24 horas
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const recentData = sortedData.filter(item => 
      new Date(item.datetime) >= twentyFourHoursAgo
    );

    const hourlyData = [];
    const daysMap = {};

    recentData.forEach((item) => {
      const date = new Date(item.datetime);
      const hour = date.getHours();
      const dayKey = date.toISOString().split("T")[0];

      if (!hourlyData[hour] || new Date(hourlyData[hour].datetime) < date) {
        hourlyData[hour] = {
          time: `${hour}:00`,
          temp: item.temperature,
          humidity: item.humidity,
          datetime: item.datetime,
        };
      }

      if (!daysMap[dayKey]) {
        daysMap[dayKey] = {
          dateStr: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][
            date.getDay()
          ],
          tempMax: item.temperature,
          tempMin: item.temperature,
          humidity: item.humidity,
          date: dayKey,
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
      location: sortedData[0]?.local_name || "Local desconhecido",
      current: {
        temp: sortedData[0]?.temperature || 0,
        humidity: sortedData[0]?.humidity || 0,
        datetime: sortedData[0]?.datetime || new Date().toISOString(),
        hourly: filteredHourly,
      },
      daily: filteredDaily,
    };
  };

  const generateAlerts = (temp, humidity) => {
    const alerts = [];
    if (temp > 32) alerts.push("Temperatura muito alta! Risco de estresse térmico.");
    if (temp < 10) alerts.push("Temperatura muito baixa! Risco de hipotermia.");
    if (humidity > 80) alerts.push("Umidade elevada. Possível ambiente abafado.");
    return alerts;
  };

  const onRefresh = () => {
    fetchData();
  };

  if (!processedData) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#60B665" />
        <Text style={{ marginTop: 10 }}>Carregando dados...</Text>
      </SafeAreaView>
    );
  }

  const temperature = `${Math.round(processedData.current.temp)}ºC`;
  const humidity = `${Math.round(processedData.current.humidity)}%`;
  const alerts = generateAlerts(
    processedData.current.temp,
    processedData.current.humidity
  );

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(70, 70, 70, ${opacity})`,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#ffffff',
      fill: '#ea4335',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      strokeWidth: 0.5,
      stroke: 'rgba(200, 200, 200, 0.5)',
    },
    fillShadowGradient: '#fce8e6',
    fillShadowGradientOpacity: 0.4,
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
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#60B665']}
              tintColor={'#60B665'}
            />
          }
        >
          <View style={styles.header}>
            <View style={styles.selectorContainer}>
              <Text style={styles.selectorLabel}>Selecione o Galpão:</Text>
              <View style={styles.warehouseContainer}>
  {warehouses.map((warehouse, index) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.warehouseButton,
        selectedWarehouse === warehouse && styles.selectedWarehouse,
      ]}
      onPress={() => setSelectedWarehouse(warehouse)}
    >
      <Text style={styles.warehouseText}>{warehouse}</Text>
    </TouchableOpacity>
  ))}
</View>
            </View>

            <Text style={styles.location}>{selectedWarehouse || "Carregando..."}</Text>
            {lastUpdated && (
              <Text style={styles.updateText}>
                Atualizado: {lastUpdated.toLocaleTimeString()}
              </Text>
            )}
          </View>
          
          <View style={styles.row}>
          <WeatherInfo selectedWarehouse={selectedWarehouse} />

          </View>
          <SmartAlertCard sensorData={processedData} />

          <Text style={styles.sectionTitle}>Tendência Horária</Text>
          <LineChart
            data={{
              labels: processedData.current.hourly.map((h, i) => i % 3 === 0 ? h.time : ""),
              datasets: [
                {
                  data: processedData.current.hourly.map((h) => h.temp),
                  color: (opacity = 1) => `rgba(234, 67, 53, ${opacity})`,
                  strokeWidth: 3,
                },
              ],
            }}
            width={screenWidth * 0.9}
            height={220}
            chartConfig={chartConfig}
            bezier
            withHorizontalLabels={true}
            withVerticalLabels={true}
            withInnerLines={true}
            withOuterLines={false}
            withDots={true}
            withShadow={false}
            style={styles.chart}
            yAxisSuffix="°C"
            yAxisInterval={5}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.chartTitle}>Variação nas últimas 24h</Text>
            {renderTrendIndicator()} 
          </View>

          <Text style={styles.sectionTitle}>Médias Diárias</Text>
          <LineChart
            data={{
              labels: processedData.daily.map((d) => d.dateStr),
              datasets: [
                {
                  data: processedData.daily.map((d) => d.tempMax),
                  color: () => "#f44336",
                  strokeWidth: 3,
                },
                {
                  data: processedData.daily.map((d) => d.tempMin),
                  color: () => "#2196f3",
                  strokeWidth: 3,
                },
              ],
            }}
            width={screenWidth * 0.9}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />

          <SummaryBox 
            min={Math.min(...processedData.daily.map(d => d.tempMin))}
            max={Math.max(...processedData.daily.map(d => d.tempMax))}
            variation={Math.abs(processedData.current.temp - processedData.daily[0].tempMin).toFixed(1)}
          />

          <View ref={chartRef}>
            <WeatherDashboard sensorData={sensorData} />
          </View>
        </ScrollView>
      </SafeAreaView>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Relatorios", { selectedWarehouse })}
      >
        <Text style={styles.buttonText}>RELATÓRIOS</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E5F1EB",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  content: {
    alignItems: "center",
    paddingBottom: 16,
  },
  header: {
    width: '90%',
    alignItems: 'center',
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    alignSelf: 'flex-start',
    marginLeft: '5%',
  },
  chart: {
    borderRadius: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  location: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 16,
  },
  updateText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#60B665",
    padding: 12,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    margin: 16,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  selectorContainer: {
    width: '90%',
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginTop: 20,
  },
  picker: {
    borderColor: "#ccc",
    backgroundColor: '#fff',
  }, warehouseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  warehouseButton: {
    padding: 8,
    margin: 4,
    backgroundColor: '#ccc',
    borderRadius: 8,
  },
  selectedWarehouse: {
    backgroundColor: '#5c9',
  },
  warehouseText: {
    color: '#000',
  },
});