import React from 'react';
import { Text, ScrollView ,Dimensions  } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { styles } from '../Relatorios/Relatorios.styles';

const screenWidth = Dimensions.get('window').width;

const LineChartComponent = ({ data, title, config, ...props }) => {
  if (!data) return null;
  
  return (
    <>
      <Text style={styles.chartTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <LineChart
          data={data}
          width={Math.max(screenWidth * (props.widthMultiplier || 1), (data.labels?.length || 0) * 50)}
          height={220}
          yAxisSuffix={data.yAxisSuffix || ''}
          chartConfig={config}
          {...props}
        />
      </ScrollView>
    </>
  );
};

export default LineChartComponent;