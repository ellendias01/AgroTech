import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import InfoCard from './InfoCard';
import axios from 'axios';
import { ApiRoutes } from '../config/api';
export default function WeatherInfo({ selectedWarehouse }) {
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [local, setLocal] = useState('');

  const fetchWeather = async () => {
    try {
      const response = await axios.get(ApiRoutes.base());
      const data = response.data;
  
      if (Array.isArray(data)) {
        const now = new Date();
  
        // Filtra só os dados do dia atual
        const todayData = data.filter((item) => {
          const itemDate = new Date(item.datetime);
          return (
            itemDate.getFullYear() === now.getFullYear() &&
            itemDate.getMonth() === now.getMonth() &&
            itemDate.getDate() === now.getDate() &&
            item.local_name === selectedWarehouse // filtro pelo galpão
          );
        });
        
        if (todayData.length === 0) {
          console.warn("Nenhum dado disponível para hoje.");
          return;
        }
  
        // Encontra o dado mais próximo do horário atual
        const closest = todayData.reduce((prev, curr) => {
          const prevDiff = Math.abs(new Date(prev.datetime) - now);
          const currDiff = Math.abs(new Date(curr.datetime) - now);
          return currDiff < prevDiff ? curr : prev;
        });
  
        setTemperature(closest.temperature);
        setHumidity(closest.humidity);
        setLocal(closest.local_name);
      } else {
        setTemperature(data.temperature);
        setHumidity(data.humidity);
        setLocal(data.local_name);
      }
    } catch (error) {
      console.error("Erro ao buscar dados do clima:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchWeather();
  
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedWarehouse]); // <- importante aqui!
 
  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;

  return (
    <View style={styles.container}>
      <View style={styles.cards}>
        <InfoCard label="Temperatura" value={temperature} type="temperature" />
        <InfoCard label="Umidade" value={humidity} type="humidity" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  cards: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
