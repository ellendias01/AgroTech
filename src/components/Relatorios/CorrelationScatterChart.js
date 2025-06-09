// Corelação e grafico de Dispersão 
import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { Svg, Line, Text as SvgText, Circle } from 'react-native-svg';

const screenWidth = Dimensions.get('window').width;

const pearsonCorrelation = (x, y) => {
  const n = x.length;
  if (n === 0) return null;

  const avgX = x.reduce((a, b) => a + b, 0) / n;
  const avgY = y.reduce((a, b) => a + b, 0) / n;

  const numerator = x.reduce((sum, xi, i) => sum + (xi - avgX) * (y[i] - avgY), 0);
  const denominator = Math.sqrt(
    x.reduce((sum, xi) => sum + Math.pow(xi - avgX, 2), 0) *
    y.reduce((sum, yi) => sum + Math.pow(yi - avgY, 2), 0)
  );


  return denominator === 0 ? null : numerator / denominator;
};
const linearRegression = (x, y) => {
  const n = x.length;
  const avgX = x.reduce((a, b) => a + b, 0) / n;
  const avgY = y.reduce((a, b) => a + b, 0) / n;

  const numerator = x.reduce((sum, xi, i) => sum + (xi - avgX) * (y[i] - avgY), 0);
  const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - avgX, 2), 0);

  const a = numerator / denominator;
  const b = avgY - a * avgX;

  return { a, b };
};

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

  const interpretCorrelation = (r) => {
    if (r === null || isNaN(r)) return { desc: 'Sem correlação', color: '#888' };
  
    const abs = Math.abs(r);
    let strength = '';
    if (abs < 0.3) strength = 'fraca';
    else if (abs < 0.7) strength = 'moderada';
    else strength = 'forte';
  
    const direction = r > 0 ? 'positiva' : 'negativa';
    const desc = `${strength.charAt(0).toUpperCase() + strength.slice(1)} ${direction}`;
  
    const color = r > 0
      ? (abs >= 0.7 ? '#2e7d32' : '#81c784') // verde forte / moderado
      : (abs >= 0.7 ? '#c62828' : '#ef9a9a'); // vermelho forte / moderado
  
    return { desc, color };
  };
  
  const correlation = pearsonCorrelation(temperatures, humidities);
  const correlationInfo = interpretCorrelation(correlation);
  const { a, b } = linearRegression(temperatures, humidities);
  const startX = minX;
  const endX = maxX;
  const startY = a * startX + b;
  const endY = a * endX + b;
  

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        📍 Dispersão Temperatura × Umidade
      </Text>
      {correlation !== null && (
  <Text style={{ fontSize: 14, marginBottom: 8, color: correlationInfo.color }}>
    Correlação (temperatura × umidade): {correlation.toFixed(4)}  {correlationInfo.desc}
  </Text>
)}

      <ScrollView horizontal>
        <Svg width={chartWidth} height={chartHeight}>
          <Line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} stroke="#999" />
          <Line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#999" />
          <Line
  x1={scaleX(startX)}
  y1={scaleY(startY)}
  x2={scaleX(endX)}
  y2={scaleY(endY)}
  stroke="#FF5722"
  strokeWidth="2"
  strokeDasharray="4"
/>

          
          {/* Rótulos */}
          <SvgText x={padding / 2} y={padding} fontSize="12" textAnchor="middle">
  {typeof maxY === 'number' ? `${maxY.toFixed(0)}%` : '–'}
</SvgText>
<SvgText x={padding / 2} y={chartHeight - padding} fontSize="12" textAnchor="middle">
  {typeof minY === 'number' ? `${minY.toFixed(0)}%` : '–'}
</SvgText>
<SvgText x={padding} y={chartHeight - padding + 20} fontSize="12" textAnchor="start">
  {typeof minX === 'number' ? `${minX.toFixed(1)}°C` : '–'}
</SvgText>
<SvgText x={chartWidth - padding} y={chartHeight - padding + 20} fontSize="12" textAnchor="end">
  {typeof maxX === 'number' ? `${maxX.toFixed(1)}°C` : '–'}
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
