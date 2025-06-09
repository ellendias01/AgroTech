const BASE_URL = "http://192.168.100.4:8080/api/dados";

export const ApiRoutes = {
  // 1. Base simples
  base: () => BASE_URL,

  // 2. Por período (usado em relatórios)
  byPeriod: (inicio, fim) =>
    `${BASE_URL}?data_inicio=${inicio}&data_fim=${fim}`,

  // 3. Por galpão e datas
  byGalpaoAndDate: (galpao, start, end) =>
    `${BASE_URL}?galpao=${encodeURIComponent(galpao)}&start=${start.toISOString()}&end=${end.toISOString()}`,

  // 4. Por data formatada (EstatisticaScreen)
  byFormattedDates: (startDate, endDate) =>
    `${BASE_URL}?data_inicio=${startDate}&data_fim=${endDate}`,

};
