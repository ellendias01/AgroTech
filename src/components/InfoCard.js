import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const screenWidth = Dimensions.get("window").width;

const getTemperatureEmoji = (temp) => {
  if (temp === null || temp === undefined) return "🌡️";
  const tempValue = Number(temp);

  if (tempValue < 10) return "❄️";
  if (tempValue < 20) return "🥶";
  if (tempValue < 27) return "😊";
  if (tempValue < 35) return "🥵";
  return "🔥";
};

const getHumidityEmoji = (humidity) => {
  if (humidity === null || humidity === undefined) return "💧";
  const humidityValue = Number(humidity);

  if (humidityValue < 30) return "🏜️";
  if (humidityValue < 50) return "🌵";
  if (humidityValue < 70) return "💧";
  if (humidityValue < 85) return "🌫️";
  return "🌊";
};

export default function InfoCard({ label, value, type }) {
  let emoji = "❓";

  if (type === "temperature") {
    emoji = getTemperatureEmoji(value);
  } else if (type === "humidity") {
    emoji = getHumidityEmoji(value);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label} {emoji}</Text>
      <Text style={styles.value}>{value !== null && value !== undefined ? value : '--'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    width: screenWidth * 0.4,
    margin: 5,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
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
});
