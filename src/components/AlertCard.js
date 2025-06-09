import React from 'react';
import { View, Text, StyleSheet } from 'react-native';  // IMPORTAR OS COMPONENTES

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
    padding: 10,
    backgroundColor: '#f8d7da',
    borderRadius: 8,
    margin: 10,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 16,
    color: '#721c24',
  },
  alertText: {
    fontSize: 14,
    color: '#721c24',
  },
});
