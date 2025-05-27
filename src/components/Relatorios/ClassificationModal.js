import React from 'react';
import { View, Text, Modal, Button, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { chartConfigs } from '../../utils/relatorios/chartConfigs';
import { styles } from './Relatorios.styles';


const screenWidth = Dimensions.get('window').width;

const ClassificationModal = ({ visible, onClose, data }) => {
  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>🌡️ Classificação de Temperatura</Text>

        {data.length > 0 ? (
          <>
            {data.map((item, index) => (
              <Text key={index} style={{ marginBottom: 5 }}>
                {item.name}: {item.population} registros
              </Text>
            ))}

            <PieChart
              data={data}
              width={screenWidth - 40}
              height={200}
              chartConfig={chartConfigs.temp}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
            />
          </>
        ) : (
          <Text>Nenhum dado disponível</Text>
        )}

        <Button title="Fechar" onPress={onClose} />
      </View>
    </Modal>
  );
};

export default ClassificationModal;

