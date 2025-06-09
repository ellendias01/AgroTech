import React from 'react';
import { View, Text, Modal, ScrollView, Button } from 'react-native';
import { styles } from './Relatorios.styles';

const labelMap = {
  min: '🔻 Mínimo',
  max: '🔺 Máximo',
  avg: '📏 Média',
  q1: '📊 1º Quartil',
  median: '📍 Mediana',
  q3: '📊 3º Quartil',
  moda: '📈 Moda',
  stdDev: '📐 Desvio Padrão',
  skewness: '📉 Assimetria',
  kurtosis: '🌀 Curtose',
  isNormal: '✅ Distribuição Normal?',
};


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
              {Object.entries(estatisticas[tipo]).map(([label, valor]) => {
  
  return (
    <View key={label} style={styles.modalRow}>
      <Text style={styles.modalLabel}>{labelMap[label.trim().toLowerCase()] || label}:</Text>
      <Text>
        {Array.isArray(valor)
          ? valor.join(', ')
          : label === 'isNormal'
            ? valor ? 'Sim' : 'Não'
            : String(valor)}
      </Text>
    </View>
  );
})}
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
