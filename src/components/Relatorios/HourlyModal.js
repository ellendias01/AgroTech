// Média por hora 
import React from 'react';
import { View, Text, Modal, ScrollView, Button } from 'react-native';
import { round } from 'lodash';
import { styles } from './Relatorios.styles';

const HourlyModal = ({ visible, onClose, hourlyAverages }) => {
  if (!hourlyAverages || hourlyAverages.length === 0) return null;

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalContainer}>
        <ScrollView>
          <Text style={styles.modalTitle}>⏱️ Médias por Hora</Text>

          <Text style={styles.modalSubtitle}>Temperatura (°C)</Text>
          {hourlyAverages.map((h, i) => (
            <View key={`temp-${i}`} style={styles.modalRow}>
              <Text style={styles.modalLabel}>{h.hour}h:</Text>
              <Text>{round(h.tempAvg, 1)}°C</Text>
            </View>
          ))}

          <Text style={styles.modalSubtitle}>Umidade (%)</Text>
          {hourlyAverages.map((h, i) => (
            <View key={`humid-${i}`} style={styles.modalRow}>
              <Text style={styles.modalLabel}>{h.hour}h:</Text>
              <Text>{round(h.humidityAvg, 1)}%</Text>
            </View>
          ))}

          <Button title="Fechar" onPress={onClose} />
        </ScrollView>
      </View>
    </Modal>
  );
};

export default HourlyModal;
