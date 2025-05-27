import React, { useMemo } from 'react';
import { View, Text, Modal, ScrollView, Button } from 'react-native';
import { round } from 'lodash';
import { styles } from '../Relatorios/Relatorios.styles';

const DailyModal = ({ visible, onClose, dailyAverages }) => {
  if (!dailyAverages || dailyAverages.length === 0) return null;

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalContainer}>
        <ScrollView>
          <Text style={styles.modalTitle}>📅 Médias Diárias</Text>

          <Text style={styles.modalSubtitle}>Temperatura (°C)</Text>
          {dailyAverages.map((d, i) => (
            <View key={`temp-${i}`} style={styles.modalRow}>
              <Text style={styles.modalLabel}>{d.dateStr}:</Text>
              <Text>
                Média: {round(d.tempAvg, 1)} | Máx: {round(d.tempMax, 1)} | Mín: {round(d.tempMin, 1)}
              </Text>
            </View>
          ))}

          <Text style={styles.modalSubtitle}>Umidade (%)</Text>
          {dailyAverages.map((d, i) => (
            <View key={`humid-${i}`} style={styles.modalRow}>
              <Text style={styles.modalLabel}>{d.dateStr}:</Text>
              <Text>{round(d.humidityAvg, 1)}%</Text>
            </View>
          ))}

          <Button title="Fechar" onPress={onClose} />
        </ScrollView>
      </View>
    </Modal>
  );
};

export default DailyModal;
