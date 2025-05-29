import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';



export const captureViewAsPDF = async (ref, fileName = 'relatorio') => {
  try {
    console.log('📸 Capturando imagem da view...');
    const base64 = await captureRef(ref, {
      format: 'jpg',
      quality: 1,
      result: 'base64',  // capturar em base64
    });

    const htmlContent = `
      <html>
        <body style="text-align: center; padding: 0; margin: 0;">
          <img src="data:image/jpeg;base64,${base64}" style="width: 100%; max-width: 100%;" />
        </body>
      </html>
    `;

    const { uri: pdfUri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    console.log('📄 PDF gerado em:', pdfUri);

    await Sharing.shareAsync(pdfUri); // Exibe opção de compartilhar ou salvar

    return pdfUri;
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
    throw error;
  }
};

