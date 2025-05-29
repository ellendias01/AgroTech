import React, { useEffect, useState,useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
} from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from "react-native-vector-icons/MaterialIcons";
import { LineChart } from "react-native-chart-kit";
import InfoCard from "../components/InfoCard";
import SmartAlertCard from "../components/Charts/SmartAlertCard";
import SummaryBox from "../components/SummaryBox";
import WeatherDashboard from '../components/Charts/WeatherDashboard';

const screenWidth = Dimensions.get("window").width;

export default function HomeScreen({ navigation }) {
  const [sensorData, setSensorData] = useState([]);
  const [processedData, setProcessedData] = useState(null);
const chartRef = useRef();

  useEffect(() => {
    fetch("http://192.168.100.7:8080/api/dados") // Substitua pela sua URL real
      .then((res) => res.json())
      .then((data) => {
        setSensorData(data);
        setProcessedData(processData(data));
      })
      .catch((error) => console.error("Erro ao buscar dados:", error));
  }, []);

  const processData = (rawData) => {
    if (!rawData || rawData.length === 0) return null;

    const sortedData = [...rawData].sort(
      (a, b) => new Date(a.datetime) - new Date(b.datetime)
    );

    const hourlyData = [];
    const daysMap = {};

    sortedData.forEach((item) => {
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
      location: sortedData[0].local_name,
      current: {
        temp: sortedData[sortedData.length - 1].temperature,
        humidity: sortedData[sortedData.length - 1].humidity,
        datetime: sortedData[sortedData.length - 1].datetime,
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

  const chartData = {
    labels: processedData.current.hourly.map((h, i) => (i % 3 === 0 ? h.time : "")),
    datasets: [
      {
        data: processedData.current.hourly.map((h) => h.temp),
        color: () => "#FFA500",
        strokeWidth: 3,
      },
    ],
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

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.location}>{processedData.location}</Text>

        <View style={styles.row}>
        <InfoCard label="Temperatura" value={temperature} type="temperature" />
      <InfoCard label="Umidade" value={humidity} type="humidity" />
        </View>

        <SmartAlertCard sensorData={processedData} />



<Text style={styles.sectionTitle}>Tendência Horária</Text>
<LineChart
  data={{
    labels: processedData.current.hourly.map((h, i) =>
      i % 3 === 0 ? h.time : ""
    ),
    datasets: [
      {
        data: processedData.current.hourly.map((h) => h.temp),
        color: (opacity = 1) => `rgba(234, 67, 53, ${opacity})`, // Vermelho Google
        strokeWidth: 3,
      },
    ],
  }}
  width={screenWidth * 0.9}
  height={220}
  chartConfig={chartConfig}
  bezier // Linha suavizada
  withHorizontalLabels={true}
  withVerticalLabels={true}
  withInnerLines={true}
  withOuterLines={false}
  withDots={true}
  withShadow={false}
  style={styles.chart}
  yAxisSuffix="°C"
  yAxisInterval={5} // 
  
/>
<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
  <Text style={styles.chartTitle}>Tendência Horária</Text>
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
          min={`${Math.round(
            Math.min(...processedData.daily.map((d) => d.tempMin))
          )}`}
          max={`${Math.round(
            Math.max(...processedData.daily.map((d) => d.tempMax))
          )}`}
          variation={`${Math.abs(
            processedData.current.temp - processedData.daily[0].tempMin
          ).toFixed(1)}`}
        />

<TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Relatorios")}
          >
            <Text style={styles.buttonText}>RELATÓRIOS</Text>
          </TouchableOpacity>
          
<View ref={chartRef}>
        <WeatherDashboard sensorData={sensorData} />
      </View>
      
      </ScrollView>
    </SafeAreaView>
      <StatusBar
        barStyle="dark-content" 
        backgroundColor="#FFF" 
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Icon name="menu" size={28} color="#fff" style={styles.icon} />
            <View style={styles.titleWrapper}>
              <Text style={styles.headerText}>Home</Text>
            </View>
            <Image
              source={{ uri: "https://i.imgur.com/0y0y0y0.png" }}
              style={styles.avatar}
            />
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.row}>
              <InfoCard label="Temperatura" value={`☀️ ${temperature}`} />
              <InfoCard label="Umidade" value={`💧 ${humidity}`} />
            </View>

            <AlertCard alerts={alerts} />

            <Text style={styles.graphTitle}>Sensor pasto 1</Text>
            <LineChart
              data={chartData}
              width={screenWidth * 0.9}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
            />

            <SummaryBox min="13,3" max="35,3" variation="15,3" />

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("Relatorios")}
            >
              <Text style={styles.buttonText}>RELATÓRIOS</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E5F1EB",
  },
  container: {
    flex: 1,
    backgroundColor: "#E5F1EB",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    backgroundColor: "#60B665", 
    paddingVertical: 16,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  icon: {
    width: 28,
  },
  titleWrapper: {
    flex: 1,
    alignItems: "center",
  },
  headerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  content: {
    alignItems: "center",
    paddingVertical: 20,
  },
  location: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 10,
  },
  graphTitle: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  button: {
    backgroundColor: "#87D6A9",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginTop: 10,
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
    textAlign: "center",
  },sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
    color: "#444",
  },
});
