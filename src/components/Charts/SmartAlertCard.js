import React, { useEffect, useState } from 'react';
import { Text } from 'react-native'; // <--- IMPORTAÇÃO DO Text
import axios from 'axios';
import AlertCard from '../AlertCard';

import { ApiRoutes } from '../../config/api';
export default function SmartAlertCard({ sensorData }) {
  // Estados para dados do fetch
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [local, setLocal] = useState('');
  const [loading, setLoading] = useState(true);

    const [selectedWarehouse, setSelectedWarehouse] = useState("Galpão Sudeste - Lote 68"); // Estado para o galpão selecionado
    const [warehouses, setWarehouses] = useState([ // Lista de galpões disponíveis
        "Todos os Galpões",
        "Galpão Sul - Lote 15",
        "Galpão Base - Lote 02",
        "Galpão Sudeste - Lote 68"
      ]);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      const response = await axios.get(ApiRoutes.base());
      const data = response.data;

      if (Array.isArray(data)) {
        const now = new Date();

        // Filtra os dados do dia atual
        const todayData = data.filter((item) => {
          const itemDate = new Date(item.datetime);
          return (
            itemDate.getFullYear() === now.getFullYear() &&
            itemDate.getMonth() === now.getMonth() &&
            itemDate.getDate() === now.getDate()
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
        // Se for um objeto só
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

    // Atualiza a cada 10 minutos
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedWarehouse]);

  const dataToUse = sensorData?.current
    ? {
        temp: sensorData.current.temp,
        humidity: sensorData.current.humidity,
        datetime: sensorData.current.datetime,
        hourly: sensorData.current.hourly || [],
      }
    : temperature !== null && humidity !== null
    ? {
        temp: temperature,
        humidity: humidity,
        datetime: new Date().toISOString(),
        hourly: [],
      }
    : null;

  if (!dataToUse || loading) {
    return <Text>Carregando dados...</Text>;
  }

  // Gera alertas com os dados escolhidos
  const generateAlerts = (data) => {
    const alerts = [];
    const { temp, humidity, datetime, hourly } = data;

    if (temp > 32) alerts.push("🔥 Temperatura muito alta! Risco de estresse térmico.");
    if (temp < 10) alerts.push("❄️ Temperatura muito baixa! Risco de hipotermia.");
    if (humidity > 80) alerts.push("💧 Umidade elevada. Ambiente abafado.");
    if (humidity < 30) alerts.push("🌵 Umidade muito baixa. Risco de ressecamento.");

    if (hourly.length >= 4) {
      const temp3hAgo = hourly[hourly.length - 4]?.temp;
      const variation = temp - temp3hAgo;
      if (variation >= 3) alerts.push("📈 Tendência de aquecimento detectada.");
      if (variation <= -3) alerts.push("📉 Tendência de resfriamento detectada.");
    }

    const lastReadingTime = new Date(datetime);
    const now = new Date();
    const diffMinutes = Math.floor((now - lastReadingTime) / 60000);

    if (diffMinutes > 60) {
      alerts.push("⏱️ Sensor pode estar inativo (última leitura há mais de 1h).");
    }

    return alerts;
  };

  const alerts = generateAlerts(dataToUse);

  return <AlertCard alerts={alerts} local={local} />;
}
