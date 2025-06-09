//Dispersão e correlação da Temperatura e Horario 
import React from 'react';
import { View, Text, Dimensions, ScrollView } from 'react-native';
import { Svg, Line, Text as SvgText, Circle, G } from 'react-native-svg';

const screenWidth = Dimensions.get('window').width;

const ScatterTempHorarioChart = ({ filteredData }) => {
  if (!filteredData || filteredData.length === 0) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 16, color: '#666' }}>
          Nenhum dado disponível para exibir o gráfico.
        </Text>
      </View>
    );
  }

  // Processamento mais tolerante dos dados
  const processedData = filteredData
    .map(d => {
      try {
        // Verifica se temperature existe e é número
        const temp = parseFloat(d.temperature);
        if (isNaN(temp)) return null;
        
        // Tenta converter datetime de várias formas
        let date;
        if (d.datetime instanceof Date) {
          date = d.datetime;
        } else if (typeof d.datetime === 'string') {
          date = new Date(d.datetime);
        } else if (d.timestamp) {
          date = new Date(d.timestamp);
        } else {
          return null;
        }
        
        if (isNaN(date.getTime())) return null;
        
        return {
          temperature: temp,
          hour: date.getHours() + date.getMinutes() / 60
        };
      } catch (e) {
        console.warn('Erro ao processar dado:', d, e);
        return null;
      }
    })
    .filter(Boolean);

  if (processedData.length === 0) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 16, color: '#666' }}>
          Dados insuficientes. Formato esperado: {'{'} temperature: number, datetime: Date/string {'}'}
        </Text>
      </View>
    );
  }

  const hours = processedData.map(d => d.hour);
  const temps = processedData.map(d => d.temperature);

  const minX = Math.min(...hours);
  const maxX = Math.max(...hours);
  const minY = Math.min(...temps);
  const maxY = Math.max(...temps);

  // Add some padding to Y axis for better visualization
  const yPadding = (maxY - minY) * 0.1;
  const adjustedMinY = minY - yPadding;
  const adjustedMaxY = maxY + yPadding;

  const chartWidth = Math.max(screenWidth - 40, 800); // Minimum width of 800 for wide charts
  const chartHeight = 300;
  const padding = {
    left: 50,
    right: 20,
    top: 20,
    bottom: 50
  };

  const scaleX = value => padding.left + ((value - minX) / (maxX - minX)) * (chartWidth - padding.left - padding.right);
  const scaleY = value => chartHeight - padding.bottom - ((value - adjustedMinY) / (adjustedMaxY - adjustedMinY)) * (chartHeight - padding.top - padding.bottom);

  // Pearson correlation coefficient calculation
  const n = hours.length;
  const avgX = hours.reduce((a, b) => a + b, 0) / n;
  const avgY = temps.reduce((a, b) => a + b, 0) / n;

  const numerator = hours.reduce((sum, xi, i) => sum + (xi - avgX) * (temps[i] - avgY), 0);
  const denominator = Math.sqrt(
    hours.reduce((sum, xi) => sum + Math.pow(xi - avgX, 2), 0) *
    temps.reduce((sum, yi) => sum + Math.pow(yi - avgY, 2), 0)
  );

  const correlation = numerator / denominator;

  // Correlation interpretation
  const interpretCorrelation = (r) => {
    if (isNaN(r)) return { desc: 'Sem correlação', color: '#888' };

    const abs = Math.abs(r);
    let strength = '';
    if (abs < 0.3) strength = 'fraca';
    else if (abs < 0.7) strength = 'moderada';
    else strength = 'forte';

    const direction = r > 0 ? 'positiva' : 'negativa';
    const desc = `${strength.charAt(0).toUpperCase() + strength.slice(1)} ${direction}`;

    const color = r > 0
      ? (abs >= 0.7 ? '#2e7d32' : '#81c784') // green strong / moderate
      : (abs >= 0.7 ? '#c62828' : '#ef9a9a'); // red strong / moderate

    return { desc, color };
  };

  const correlationInfo = interpretCorrelation(correlation);

  // Trend line calculation (linear regression)
  const slope = numerator / hours.reduce((sum, xi) => sum + Math.pow(xi - avgX, 2), 0);
  const intercept = avgY - slope * avgX;

  const startX = minX;
  const endX = maxX;
  const startY = slope * startX + intercept;
  const endY = slope * endX + intercept;

  // Grid lines and ticks
  const xTicks = [];
  for (let i = 0; i <= 24; i += 2) {
    xTicks.push(i);
  }

  const yTicks = [];
  const yStep = Math.ceil((adjustedMaxY - adjustedMinY) / 5);
  for (let i = Math.ceil(adjustedMinY / yStep) * yStep; i <= adjustedMaxY; i += yStep) {
    yTicks.push(i);
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        📍 Dispersão Temperatura × Horário
      </Text>
      
     

      <Text style={{ fontSize: 14, marginBottom: 8, color: correlationInfo.color }}>
        Correlação (temperatura × horário): {correlation.toFixed(4)} {correlationInfo.desc}
      </Text>

      <ScrollView horizontal>
  <Svg width={chartWidth} height={chartHeight}>
    {/* Eixos */}
    <Line
      x1={padding.left}
      y1={padding.top}
      x2={padding.left}
      y2={chartHeight - padding.bottom}
      stroke="#000"
      strokeWidth="1"
    />
    <Line
      x1={padding.left}
      y1={chartHeight - padding.bottom}
      x2={chartWidth - padding.right}
      y2={chartHeight - padding.bottom}
      stroke="#000"
      strokeWidth="1"
    />

    {/* Linha de tendência */}
    <Line
      x1={scaleX(startX)}
      y1={scaleY(startY)}
      x2={scaleX(endX)}
      y2={scaleY(endY)}
      stroke="#888"
      strokeWidth="2"
      strokeDasharray="4"
    />

    {/* Rótulos nos eixos */}
    <SvgText
      x={padding.left / 2}
      y={padding.top}
      fontSize="12"
      textAnchor="middle"
    >
      {typeof Math.max(...processedData.map(d => d.temperature)) === 'number'
        ? `${Math.max(...processedData.map(d => d.temperature)).toFixed(1)}°C`
        : '–'}
    </SvgText>

    <SvgText
      x={padding.left / 2}
      y={chartHeight - padding.bottom}
      fontSize="12"
      textAnchor="middle"
    >
      {typeof Math.min(...processedData.map(d => d.temperature)) === 'number'
        ? `${Math.min(...processedData.map(d => d.temperature)).toFixed(1)}°C`
        : '–'}
    </SvgText>

    <SvgText
      x={padding.left}
      y={chartHeight - padding.bottom + 20}
      fontSize="12"
      textAnchor="start"
    >
      {xTicks.length > 0 ? `${Math.min(...xTicks)}h` : '–'}
    </SvgText>

    <SvgText
      x={chartWidth - padding.right}
      y={chartHeight - padding.bottom + 20}
      fontSize="12"
      textAnchor="end"
    >
      {xTicks.length > 0 ? `${Math.max(...xTicks)}h` : '–'}
    </SvgText>

    {/* Títulos dos eixos */}
    <SvgText
      x={chartWidth / 2}
      y={chartHeight - 5}
      fontSize="14"
      textAnchor="middle"
      fontWeight="bold"
      fill="#000"
    >
      Horário do dia (h)
    </SvgText>
    <SvgText
      x={15}
      y={chartHeight / 2}
      fontSize="14"
      textAnchor="middle"
      fontWeight="bold"
      fill="#000"
      transform={`rotate(-90, 15, ${chartHeight / 2})`}
    >
      Temperatura (°C)
    </SvgText>

    {/* Pontos de dados */}
    {processedData.map((d, i) => (
      <Circle
        key={i}
        cx={scaleX(d.hour)}
        cy={scaleY(d.temperature)}
        r="5"
        fill="#ff6384"
        opacity="0.8"
      />
    ))}
  </Svg>
</ScrollView>

    </View>
  );
};

export default ScatterTempHorarioChart;