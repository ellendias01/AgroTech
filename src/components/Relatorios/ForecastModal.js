import React from 'react';
import { View, Text, Modal, Button } from 'react-native';
import { styles } from './Relatorios.styles';

const ForecastModal = ({ visible, onClose, forecastData }) => {
  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>🔮 Previsão para 7 Dias</Text>
        {forecastData && forecastData.length > 0 ? (
          forecastData.map((dia, i) => (
            <View key={i} style={styles.modalRow}>
              <Text style={styles.modalLabel}>{dia.dateStr}:</Text>
              <Text>{dia.temp}°C</Text>
            </View>
          ))
        ) : (
          <Text>Dados insuficientes para previsão.</Text>
        )}
        <Button title="Fechar" onPress={onClose} />
      </View>
    </Modal>
  );
};

export default ForecastModal;
