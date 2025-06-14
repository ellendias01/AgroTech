const BASE_URL = "http://192.168.18.30:8080/api/dados";

export const ApiRoutes = {
  // 1. Base simples
  base: () => BASE_URL,

  // 2. Por período (relatórios)
  byPeriod: (inicio, fim) =>
    `${BASE_URL}?data_inicio=${inicio}&data_fim=${fim}`,

  // 3. Por galpão e datas (ajustado com nomes reais da API)
  byGalpaoAndDate: (localName, start, end) =>
    `${BASE_URL}?local_name=${encodeURIComponent(localName)}&data_inicio=${start}&data_fim=${end}`,

  // 4. Por data formatada
  byFormattedDates: (startDate, endDate) =>
    `${BASE_URL}?data_inicio=${startDate}&data_fim=${endDate}`,
};
