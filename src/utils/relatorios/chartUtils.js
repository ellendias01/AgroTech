import React, { useCallback } from 'react';
import { Text, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';


const renderLineChart = useCallback(
  (data, title, config = chartConfigs.temp, options = {}) => {
    if (!data) return null;

    const {
      bezier = false,
      segments = 4,
      xLabelsOffset = 0,
      yLabelsOffset = 0,
      withDots = true,
      scrollable = true,
      style = styles.chart,
      fromZero = false,
    } = options;

    const chartComponent = (
      <LineChart
        data={data}
        width={Math.max(screenWidth, (data.labels?.length || 0) * 50)}
        height={220}
        yAxisSuffix={data.yAxisSuffix || ''}
        chartConfig={config}
        style={style}
        fromZero={fromZero}
        withDots={withDots}
        bezier={bezier}
        segments={segments}
        xLabelsOffset={xLabelsOffset}
        yLabelsOffset={yLabelsOffset}
      />
    );

    return (
      <>
        <Text style={styles.chartTitle}>{title}</Text>
        {scrollable ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {chartComponent}
          </ScrollView>
        ) : (
          chartComponent
        )}
      </>
    );
  },
  []
);

export default renderLineChart;
