import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LineChart } from "react-native-chart-kit";
import InfoCard from "../components/InfoCard";
import AlertCard from "../components/AlertCard";
import SummaryBox from "../components/SummaryBox";
import { ApiRoutes } from '../config/api';
const screenWidth = Dimensions.get("window").width;

export default function HomeScreen({ navigation }) {
  const [sensorData, setSensorData] = useState([]);
  const [processedData, setProcessedData] = useState(null);

  useEffect(() => {
    fetch(ApiRoutes.base())// Substitua pela sua URL real
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
    const dailyData = [];
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
  const alerts = [`Local: ${processedData.location}`, `Última leitura: ${temperature}`];

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
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={{ backgroundColor: "#6200EE" }} />
      <SafeAreaView style={styles.container}>
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

          <SummaryBox
            min={`${Math.round(Math.min(...processedData.daily.map(d => d.tempMin)))}°`}
            max={`${Math.round(Math.max(...processedData.daily.map(d => d.tempMax)))}°`}
            variation={`${Math.abs(processedData.current.temp - processedData.daily[0].tempMin).toFixed(1)}°`}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Relatorios")}
          >
            <Text style={styles.buttonText}>RELATÓRIOS</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
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
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
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
  },
});
