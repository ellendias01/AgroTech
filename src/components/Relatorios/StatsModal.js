import React from 'react';
import { View, Text, Modal, ScrollView, Button } from 'react-native';
import { styles } from './Relatorios.styles';

const StatsModal = ({ visible, onClose, estatisticas }) => {
  if (!estatisticas) return null;

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalContainer}>
        <ScrollView>
          <Text style={styles.modalTitle}>📊 Estatísticas Detalhadas</Text>

          {['temperatura', 'umidade'].map((tipo) => (
            <View key={tipo}>
              <Text style={styles.modalSubtitle}>
                {tipo === 'temperatura' ? 'Temperatura (°C)' : 'Umidade (%)'}
              </Text>
              {Object.entries(estatisticas[tipo]).map(([label, valor]) => (
                <View key={label} style={styles.modalRow}>
                  <Text style={styles.modalLabel}>{label}:</Text>
                  <Text>
                    {Array.isArray(valor) ? valor.join(', ') : String(valor)}
                  </Text>
                </View>
              ))}
            </View>
          ))}

          <Text style={styles.modalSubtitle}>Correlação</Text>
          <View style={styles.modalRow}>
            <Text style={styles.modalLabel}>Temperatura × Umidade:</Text>
            <Text>{estatisticas.correlacao}</Text>
          </View>

          <Button title="Fechar" onPress={onClose} />
        </ScrollView>
      </View>
    </Modal>
  );
};

export default StatsModal;
