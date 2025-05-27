import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { Svg, Line, Text as SvgText, Circle } from 'react-native-svg';

const screenWidth = Dimensions.get('window').width;


const CorrelationScatterChart = ({ filteredData }) => {
  const validData = filteredData.filter(
    (d) => !isNaN(d.temperature) && !isNaN(d.humidity)
  );
  if (validData.length === 0) return null;

  const temperatures = validData.map((d) => d.temperature);
  const humidities = validData.map((d) => d.humidity);

  const minX = Math.min(...temperatures);
  const maxX = Math.max(...temperatures);
  const minY = Math.min(...humidities);
  const maxY = Math.max(...humidities);

  const chartWidth = screenWidth * 1.2;
  const chartHeight = 300;
  const padding = 40;

  const scaleX = (val) =>
    padding + ((val - minX) / (maxX - minX)) * (chartWidth - padding * 2);
  const scaleY = (val) =>
    chartHeight - padding - ((val - minY) / (maxY - minY)) * (chartHeight - padding * 2);

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        📍 Dispersão Temperatura × Umidade
      </Text>
      <ScrollView horizontal>
        <Svg width={chartWidth} height={chartHeight}>
          <Line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} stroke="#999" />
          <Line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#999" />
         
         
          {/* Rótulos */}
          <SvgText x={padding / 2} y={padding} fontSize="12" textAnchor="middle">
            {maxY.toFixed(0)}%
          </SvgText>
          <SvgText x={padding / 2} y={chartHeight - padding} fontSize="12" textAnchor="middle">
            {minY.toFixed(0)}%
          </SvgText>
          <SvgText x={padding} y={chartHeight - padding + 20} fontSize="12" textAnchor="start">
            {minX.toFixed(1)}°C
          </SvgText>
          <SvgText x={chartWidth - padding} y={chartHeight - padding + 20} fontSize="12" textAnchor="end">
            {maxX.toFixed(1)}°C
          </SvgText>



          <SvgText x={chartWidth / 2} y={chartHeight - 5} fontSize="14" textAnchor="middle">
            Temperatura (°C)
          </SvgText>
          <SvgText x={15} y={chartHeight / 2} fontSize="14" textAnchor="middle" transform={`rotate(-90, 15, ${chartHeight / 2})`}>
            Umidade (%)
          </SvgText>

          {validData.map((d, i) => (
            <Circle
              key={i}
              cx={scaleX(d.temperature)}
              cy={scaleY(d.humidity)}
              r="5"
              fill="#2196F3"
              opacity="0.8"
            />
          ))}
        </Svg>
      </ScrollView>
    </View>
  );
};

export default CorrelationScatterChart;
