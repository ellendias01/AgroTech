
//Temperatura média por hora
import React, { useMemo } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { styles } from './Relatorios.styles';
import PropTypes from 'prop-types';

const screenWidth = Dimensions.get('window').width;
const parseSafeDate = (datetime) => {
  if (typeof datetime !== 'string') return null;
  const date = new Date(datetime);
  return isNaN(date.getTime()) ? null : date;
};

const TemperaturaHorarioChart = ({ filteredData }) => {
  const dataPorHora = useMemo(() => {
    const tempPorHora = Array(24).fill(null).map(() => []);

    filteredData.forEach(({ temperature, datetime }) => {
      try {
        if (typeof datetime !== 'string') {
          console.warn('Datetime ausente ou inválido:', datetime);
          return;
        }
      
        const date = parseSafeDate(datetime);
        if (!date) {
          console.warn('Data inválida:', datetime);
          return;
        }
      
        const hour = date.getHours();
        if (temperature != null) {
          tempPorHora[hour].push(temperature);
        }
      } catch (e) {
        console.warn('Data inválida:', datetime);
      }
    });

    return tempPorHora.map(arr =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null
    );
  }, [filteredData]);

  const chartData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
    datasets: [{
      data: dataPorHora,
      strokeWidth: 2,
    }],
  };

  return (
    <View style={{ marginVertical: 16 }}>
    <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>
      🌡️ Temperatura Média por Hora
    </Text>
    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
      <LineChart
        data={chartData}
        width={Math.max(screenWidth, chartData.labels.length * 60)} // largura maior para as horas
        height={220}
        yAxisSuffix="°C"
        chartConfig={{
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        bezier
        style={{ borderRadius: 8 }}
      />
    </ScrollView>
  </View>)
};

TemperaturaHorarioChart.propTypes = {
  filteredData: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      datetime: PropTypes.string.isRequired,
      temperature: PropTypes.number,
      humidity: PropTypes.number,
      local_name: PropTypes.string
    })
  )
};

export default TemperaturaHorarioChart;
