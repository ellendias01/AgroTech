import axios from "axios";


const API_KEY = '6ruKCTWUQjSdktVN';
const BASE_URL = 'https://my.meteoblue.com/packages/basic-day';

export async function getWeather(lat, lon) {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        apikey: API_KEY,
        lat: lat,
        lon: lon,
        format: 'json',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar dados da meteoblue:", error.message);
    return null;
  }
}

