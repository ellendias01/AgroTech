import React, { useState } from "react";
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
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LineChart } from "react-native-chart-kit";
import InfoCard from "../components/InfoCard";
import AlertCard from "../components/AlertCard";
import SummaryBox from "../components/SummaryBox";

const screenWidth = Dimensions.get("window").width;

export default function HomeScreen({ navigation }) {
  const [temperature] = useState("22ºC");
  const [humidity] = useState("80%");
  const [alerts] = useState([
    "Temperatura elevada",
    "Sensor com aquecimento",
  ]);

  const chartData = {
    labels: ["9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"],
    datasets: [
      {
        data: [19.0, 20.0, 21.0, 22.5, 21.0, 23.0, 24.0],
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
