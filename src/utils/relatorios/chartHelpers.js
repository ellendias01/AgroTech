
export const processChartData = (data) => {
    return data
      .filter(d => d.temperature != null && d.datetime != null)
      .map(d => {
        try {
          const date = new Date(d.datetime);
          return {
            ...d,
            hour: date.getHours(),
            hourDecimal: date.getHours() + date.getMinutes() / 60
          };
        } catch (e) {
          return null;
        }
      })
      .filter(d => d != null);
  };