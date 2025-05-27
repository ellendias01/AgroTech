import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';


const screenWidth = Dimensions.get("window").width;


export default function AlertCard({ alerts = [] }) {
  return (
    <View style={styles.alertCard}>
      <Text style={styles.label}>Alertas</Text>
      {alerts.map((alert, index) => (
        <Text key={index} style={styles.alertText}>🔴 {alert}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    width: screenWidth * 0.85,
    marginVertical: 10,
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
  alertText: {
    fontSize: 14,
    color: '#C62828',
    marginTop: 4,
  },
});
