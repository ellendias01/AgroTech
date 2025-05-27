import React from 'react';
import AlertCard from '../AlertCard'; // mesmo diretório ou ajuste o caminho conforme necessário

export default function SmartAlertCard({ sensorData }) {
  if (!sensorData || !sensorData.current) {
    return null; // ou renderize algo como <Text>Nenhum dado disponível</Text>
  }

  const generateAlerts = (data) => {
    const alerts = [];

    const { temp, humidity, datetime, hourly } = data.current;

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

  const alerts = generateAlerts(sensorData);

  return <AlertCard alerts={alerts} />;
}
