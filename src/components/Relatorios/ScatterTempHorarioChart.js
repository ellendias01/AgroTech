import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';


const ScatterTempHorarioChart = ({ filteredData }) => {
    if (!filteredData || filteredData.length === 0) return null;

    // Processa os dados convertendo datetime para hora
    const processedData = filteredData
  .filter(d => d.temperature != null && typeof d.datetime === 'string') // garante que datetime é string
  .map(d => {
    const date = new Date(d.datetime);

    if (isNaN(date.getTime())) {
      console.warn('Data inválida:', d.datetime);
      return null;
    }

    return {
      temperature: d.temperature,
      hour: date.getHours() + date.getMinutes() / 60
    };
  })
  .filter(Boolean); // remove nulos
  
    if (processedData.length === 0) return null;
  
    const hours = processedData.map(d => d.hour);
    const temps = processedData.map(d => d.temperature);
  
    const minX = Math.min(...hours);
    const maxX = Math.max(...hours);
    const minY = Math.min(...temps);
    const maxY = Math.max(...temps);
  
    const chartWidth = screenWidth - 40;
    const chartHeight = 250;
  
    const scaleX = value => ((value - minX) / (maxX - minX)) * chartWidth;
    const scaleY = value =>
      chartHeight - ((value - minY) / (maxY - minY)) * chartHeight;
  
  
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
          📍 Dispersão Temperatura × Horário
        </Text>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Eixos */}
          <Line
            x1={0}
            y1={chartHeight}
            x2={chartWidth}
            y2={chartHeight}
            stroke="#000"
            strokeWidth="2"
          />
          <Line
            x1={0}
            y1={0}
            x2={0}
            y2={chartHeight}
            stroke="#000"
            strokeWidth="2"
          />
  
          {/* Labels eixo X (horas) */}
          {Array.from({ length: 25 }).map((_, i) => {
            const x = (i / 24) * chartWidth;
            return (
              <SvgText
                key={`x-label-${i}`}
                x={x}
                y={chartHeight + 15}
                fontSize="10"
                fill="#000"
                textAnchor="middle"
              >
                {i}
              </SvgText>
            );
          })}
  
          {/* Labels eixo Y (temperatura) */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const y = chartHeight - t * chartHeight;
            const tempLabel = (minY + t * (maxY - minY)).toFixed(1);
            return (
              <SvgText
                key={`y-label-${i}`}
                x={-5}
                y={y}
                fontSize="10"
                fill="#000"
                textAnchor="end"
                alignmentBaseline="middle"
              >
                {tempLabel}
              </SvgText>
            );
          })}
  
         
        {/* Pontos */}
        {processedData.map((d, i) => (
          <Circle
            key={i}
            cx={scaleX(d.hour)}
            cy={scaleY(d.temperature)}
            r={4}
            fill="#ff6384"
          />
        ))}
        </Svg>
      </View>
    );
  };
  
  export default ScatterTempHorarioChart;