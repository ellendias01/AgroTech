import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const screenWidth = Dimensions.get("window").width;

export default function SummaryBox({ min, max, variation }) {
  return (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryText}>Variação diária: {variation} ºC</Text>
      <Text style={styles.summaryText}>Mínima registrada: {min} ºC</Text>
      <Text style={styles.summaryText}>Máxima registrada: {max} ºC</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
