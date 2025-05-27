const BarChartComponent = ({ data, title, config = chartConfigs.temp, withScroll = false }) => {
    if (!data) return null;
  
    const chartComponent = (
      <BarChart
        data={data}
        width={Math.max(screenWidth, (data.labels?.length || 0) * 50)}
        height={220}
        yAxisSuffix={data.yAxisSuffix || ''}
        chartConfig={config}
        style={styles.chart}
        fromZero
        showBarTops
      />
    );
  
    return (
      <>
        <Text style={styles.chartTitle}>{title}</Text>
        {withScroll ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {chartComponent}
          </ScrollView>
        ) : (
          chartComponent
        )}
      </>
    );
  };