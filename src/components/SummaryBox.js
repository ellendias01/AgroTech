import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { ApiRoutes } from '../config/api';
const screenWidth = Dimensions.get("window").width;

export default function SummaryBox() {
  const [min, setMin] = useState(null);
  const [max, setMax] = useState(null);
  const [variation, setVariation] = useState(null);

  const fetchTemperatura = () => {
    fetch(ApiRoutes.base())
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) {
          console.warn("API retornou array vazio ou inválido");
          return;
        }

        // Filtra apenas os valores de temperatura válidos
        const temperatures = data
          .map(item => Number(item.temperature))
          .filter(temp => !isNaN(temp));

        if (temperatures.length === 0) {
          console.warn("Nenhuma temperatura válida encontrada");
          return;
        }

        // Encontra a temperatura mínima e máxima
        const currentMin = Math.min(...temperatures);
        const currentMax = Math.max(...temperatures);
        
        setMin(currentMin);
        setMax(currentMax);
        setVariation((currentMax - currentMin).toFixed(2));
      })
      .catch((error) => console.error("Erro ao buscar dados:", error));
  };

  useEffect(() => {
    fetchTemperatura();

    const intervalId = setInterval(fetchTemperatura, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryText}>
        Variação diária: {variation !== null ? variation : "--"} ºC
      </Text>
      <Text style={styles.summaryText}>Mínima registrada: {min !== null ? min.toFixed(2) : "--"} ºC</Text>
      <Text style={styles.summaryText}>Máxima registrada: {max !== null ? max.toFixed(2) : "--"} ºC</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    width: screenWidth * 0.9,
    marginVertical: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 4,
    color: "#444",
  },
});