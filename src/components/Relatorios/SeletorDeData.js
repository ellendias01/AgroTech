//Selecionar Data 
import React, { useState } from 'react';
import { View, Button, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { styles } from './Relatorios.styles';

const SeletorDeData = ({ onPeriodoSelecionado }) => {
  // Função para calcular o período inicial (10 dias atrás até hoje)
  const calcularPeriodoInicial = () => {
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(fim.getDate() - 10);
    
    return {
      inicio: inicio.toISOString().split('T')[0],
      fim: fim.toISOString().split('T')[0]
    };
  };

  const [periodo, setPeriodo] = useState(calcularPeriodoInicial());
  const [showInicioPicker, setShowInicioPicker] = useState(false);
  const [showFimPicker, setShowFimPicker] = useState(false);
  
  // Converte strings YYYY-MM-DD para Date
  const dataInicio = new Date(periodo.inicio);
  const dataFim = new Date(periodo.fim);

  const onChange = (tipo) => (event, selectedDate) => {
    if (Platform.OS === 'android') {
      if (tipo === 'inicio') setShowInicioPicker(false);
      if (tipo === 'fim') setShowFimPicker(false);
    }

    if (selectedDate) {
      const novoPeriodo = {
        ...periodo,
        [tipo]: selectedDate.toISOString().split('T')[0]
      };
      
      setPeriodo(novoPeriodo);
      onPeriodoSelecionado(novoPeriodo);
    }
  };

  return (
    <View style={styles.periodoContainer}>
      <View style={styles.dateButtonContainer}>
        <Button
          title={`Início: ${dataInicio.toLocaleDateString()}`}
          onPress={() => setShowInicioPicker(true)}
        />
        {showInicioPicker && (
          <DateTimePicker
            value={dataInicio}
            mode="date"
            display="default"
            onChange={onChange('inicio')}
            maximumDate={dataFim}
          />
        )}
      </View>

      <View style={styles.dateButtonContainer}>
        <Button
          title={`Fim: ${dataFim.toLocaleDateString()}`}
          onPress={() => setShowFimPicker(true)}
        />
        {showFimPicker && (
          <DateTimePicker
            value={dataFim}
            mode="date"
            display="default"
            onChange={onChange('fim')}
            minimumDate={dataInicio}
          />
        )}
      </View>
    </View>
  );
};

export default SeletorDeData;