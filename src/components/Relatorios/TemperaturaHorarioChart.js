
//Temperatura média por hora
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { styles } from './Relatorios.styles';
import PropTypes from 'prop-types';

const screenWidth = Dimensions.get('window').width;

const TemperaturaHorarioChart = ({ filteredData }) => {
  const [tooltipPos, setTooltipPos] = useState({ visible: false, value: 0, x: 0, y: 0 });

  const dataPorHora = useMemo(() => {
    const tempPorHora = Array(24).fill(null).map(() => []);

    filteredData.forEach(({ temperature, datetime }) => {
      const date = new Date(datetime);
      const hour = date.getHours();
      if (temperature != null) {
        tempPorHora[hour].push(temperature);
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
          width={Math.max(screenWidth, chartData.labels.length * 60)}
          height={260}
          yAxisSuffix="°C"
          chartConfig={{
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          bezier
          onDataPointClick={({ value, x, y }) => {
            setTooltipPos({ visible: true, x, y, value });
            setTimeout(() => setTooltipPos({ ...tooltipPos, visible: false }), 2000);
          }}
          decorator={() => {
            return tooltipPos.visible ? (
              <View style={{
                position: 'absolute',
                top: tooltipPos.y - 40,
                left: tooltipPos.x - 20,
                backgroundColor: '#FF6384',
                padding: 6,
                borderRadius: 6,
              }}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>{tooltipPos.value.toFixed(1)}°C</Text>
              </View>
            ) : null;
          }}
          style={{ borderRadius: 8 }}
        />
      </ScrollView>
    </View>
  );
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
