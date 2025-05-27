import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { Svg, Line, Text as SvgText, Circle } from 'react-native-svg';

const screenWidth = Dimensions.get('window').width;

const ScatterCorrelationChart = ({ filteredData }) => {
  const validData = filteredData.filter(
    (d) => !isNaN(d.temperature) && !isNaN(d.humidity)
  );
  if (validData.length === 0) return null;

  const temps = validData.map((d) => d.temperature);
  const humids = validData.map((d) => d.humidity);

  const minX = Math.min(...temps);
  const maxX = Math.max(...temps);
  const minY = Math.min(...humids);
  const maxY = Math.max(...humids);

  const width = screenWidth * 1.2;
  const height = 300;
  const padding = 40;

  const scaleX = (val) =>
    padding + ((val - minX) / (maxX - minX)) * (width - padding * 2);
  const scaleY = (val) =>
    height - padding - ((val - minY) / (maxY - minY)) * (height - padding * 2);

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        📍 Dispersão Temperatura × Umidade (Simplificada)
      </Text>
      <ScrollView horizontal>
        <Svg width={width} height={height}>
          <Line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#ccc" />
          <Line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ccc" />

          {validData.map((d, i) => (
            <Circle
              key={i}
              cx={scaleX(d.temperature)}
              cy={scaleY(d.humidity)}
              r={4}
              fill="#4CAF50"
              opacity={0.7}
            />
          ))}
        </Svg>
      </ScrollView>
    </View>
  );
};

export default ScatterCorrelationChart;
