import React, { useRef } from 'react';
import { View, Button } from 'react-native';
import ViewShot from 'react-native-view-shot';
import RNHTMLtoPDF from 'react-native-html-to-pdf';

/**
 * Componente de teste opcional
 */
export const TesteViewShot = () => {
  const ref = useRef();

  const capturar = async () => {
    const uri = await ref.current.capture();
    console.log('Captura feita em:', uri);
  };

  return (
    <View style={{ flex: 1 }}>
      <ViewShot ref={ref} options={{ format: 'jpg', quality: 0.9 }}>
        <View style={{ height: 200, backgroundColor: 'tomato' }} />
      </ViewShot>

      <Button title="Capturar" onPress={capturar} />
    </View>
  );
};

/**
 * Função para capturar view como PDF
 */
export const captureViewAsPDF = async (ref, fileName = 'relatorio') => {
  const uri = await ref.current.capture();

  const options = {
    html: `<div style="text-align:center;"><img src="${uri}" style="width:100%;" /></div>`,
    fileName: fileName,
    directory: 'Documents',
  };

  const pdf = await RNHTMLtoPDF.convert(options);
  return pdf.filePath;
};
