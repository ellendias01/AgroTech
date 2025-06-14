import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import moment from 'moment';

export const captureViewAsPDF = async (ref, fileName = 'relatorio', options = {}) => {
  try {
    const {
      startDate = new Date(),
      endDate = new Date(),
      data = [],
      estatisticas = {},
      forecast = []
    } = options;

    const formatDate = date => date ? moment(date).format('DD/MM/YYYY') : 'N/A';
    const formatDateTime = date => date ? moment(date).format('DD/MM/YYYY HH:mm') : 'N/A';
    const now = moment().format('DD/MM/YYYY HH:mm');

    const limitedData = data.slice(0, 15); 

    const getCorrelationInterpretation = (value) => {
      if (value === undefined || value === null) return 'indeterminada';
      const absValue = Math.abs(value);
      if (absValue > 0.7) return 'Forte';
      if (absValue > 0.3) return 'Moderada';
      return 'Fraca';
    };

    // Gera a tabela de estatísticas detalhadas
    const generateDetailedStatisticsTableHtml = () => {
      return `
        <table class="stat-table">
          <thead>
            <tr>
              <th rowspan="2">Métrica</th>
              <th colspan="7">Temperatura (°C)</th>
              <th colspan="7">Umidade (%)</th>
            </tr>
            <tr>
              <th>Média</th>
              <th>Mín</th>
              <th>Máx</th>
              <th>Mediana</th>
              <th>Moda</th>
              <th>Desvio Pad.</th>
              <th>Distribuição</th>
              <th>Média</th>
              <th>Mín</th>
              <th>Máx</th>
              <th>Mediana</th>
              <th>Moda</th>
              <th>Desvio Pad.</th>
              <th>Distribuição</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Valores</td>
              <td>${estatisticas.temperature?.average?.toFixed(2) ?? 'N/A'}</td>
              <td>${estatisticas.temperature?.min?.toFixed(2) ?? 'N/A'}</td>
              <td>${estatisticas.temperature?.max?.toFixed(2) ?? 'N/A'}</td>
              <td>${estatisticas.temperature?.median?.toFixed(2) ?? 'N/A'}</td>
              <td>${estatisticas.temperature?.moda?.join(', ') ?? 'N/A'}</td>
              <td>${estatisticas.temperature?.stdDev?.toFixed(2) ?? 'N/A'}</td>
              <td>${estatisticas.temperature?.isNormal ? 'Normal' : '<span style="color:red">Não Normal</span>'}</td>
              <td>${estatisticas.humidity?.average?.toFixed(2) ?? 'N/A'}</td>
              <td>${estatisticas.humidity?.min?.toFixed(2) ?? 'N/A'}</td>
              <td>${estatisticas.humidity?.max?.toFixed(2) ?? 'N/A'}</td>
              <td>${estatisticas.humidity?.median?.toFixed(2) ?? 'N/A'}</td>
              <td>${estatisticas.humidity?.moda?.join(', ') ?? 'N/A'}</td>
              <td>${estatisticas.humidity?.stdDev?.toFixed(2) ?? 'N/A'}</td>
              <td>${estatisticas.humidity?.isNormal ? 'Normal' : '<span style="color:red">Não Normal</span>'}</td>
            </tr>
            <tr>
              <td>Correlação</td>
              <td colspan="14" style="text-align: center;">
                ${estatisticas.correlacao ? `Correlação entre Temperatura e Umidade: <strong>${estatisticas.correlacao?.toFixed(2)}</strong> (${getCorrelationInterpretation(estatisticas.correlacao)})` : 'N/A'}
              </td>
            </tr>
            <tr>
              <td>Total de Registros</td>
              <td colspan="14" style="text-align: center;">
                <strong>${estatisticas.totalRecords ?? data.length}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      `;
    };

    const highlights = `
      <div class="highlights-box">
        <h3 style="margin-top: 0;">Destaques Estatísticos</h3>
        <ul>
          <li>Temperatura média: <strong>${estatisticas.temperature?.average?.toFixed(2) ?? 'N/A'}°C</strong></li>
          <li>Umidade média: <strong>${estatisticas.humidity?.average?.toFixed(2) ?? 'N/A'}%</strong></li>
          <li>Variação de temperatura: <strong>${estatisticas.temperature?.min?.toFixed(2) ?? 'N/A'}°C</strong> a
              <strong>${estatisticas.temperature?.max?.toFixed(2) ?? 'N/A'}°C</strong></li>
          <li>Correlação T/UM: <strong>${estatisticas.correlacao?.toFixed(2) ?? 'N/A'}</strong>
              (${getCorrelationInterpretation(estatisticas.correlacao)})</li>
          <li>Distribuição (Temp): ${estatisticas.temperature?.isNormal ? 'Normal' : '<strong style="color:red">Não Normal</strong>'}</li>
          <li>Distribuição (Umid): ${estatisticas.humidity?.isNormal ? 'Normal' : '<strong style="color:red">Não Normal</strong>'}</li>
        </ul>
      </div>
    `;

    const htmlContent = `<!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: "Helvetica", sans-serif;
          font-size: 12px;
          color: #333;
          padding: 24px;
          background-color: #fff;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        .header img {
          max-height: 50px;
        }
        h1 {
          font-size: 20px;
          margin: 0;
          color: #2c3e50;
        }
        h2, h3 {
          color: #34495e;
          margin-bottom: 10px;
        }
        p {
          text-align: center;
          margin-top: 0;
          margin-bottom: 24px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          font-size: 11px;
          table-layout: fixed;
        }
        th, td {
          border: 1px solid #ccc;
          padding: 8px;
          text-align: center;
          word-wrap: break-word;
        }
        th {
          background-color: #f8f8f8;
          font-weight: bold;
        }
        .stat-table th {
          background-color: #dfe6e9;
        }
        tbody tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .stat-table th, .stat-table td {
          font-size: 10px;
          padding: 4px;
        }
        .highlight {
          background-color: #f0f8ff;
          font-weight: bold;
        }
        .highlights-box {
          margin: 20px 0;
          padding: 15px;
          background: #f5f5f5;
          border-radius: 8px;
        }
        .highlights-box h3 {
          margin-top: 0;
          font-size: 16px;
        }
        .highlights-box ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .highlights-box li {
          margin-bottom: 8px;
        }
        .highlights-box li strong {
          color: #0056b3;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          font-size: 10px;
          color: #999;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <!-- Adicione aqui seu logo se desejar -->
      </div>

      <h1>Relatório de Estatísticas Ambientais</h1>
      <h2>${data?.[0]?.local_name || 'Local Desconhecido'}</h2>
      <p><strong>Período:</strong> ${formatDate(startDate)} até ${formatDate(endDate)}</p>
      
      ${highlights}

      <h3>Estatísticas Detalhadas</h3>
      ${generateDetailedStatisticsTableHtml()}

      <h3>Registros Brutos (últimos ${limitedData.length} registros)</h3>
      <table>
        <thead>
          <tr>
            <th>#</th><th>Data/Hora</th><th>Temp. (°C)</th><th>Umidade (%)</th><th>Local</th>
          </tr>
        </thead>
        <tbody>
          ${limitedData.map((d, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${formatDateTime(d.datetime)}</td>
              <td>${d.temperature?.toFixed(2) ?? 'N/A'}</td>
              <td>${d.humidity?.toFixed(2) ?? 'N/A'}</td>
              <td>${d.local_name || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        Relatório gerado em: ${now}
      </div>
    </body>
    </html>`;

    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      width: 794,  // Largura A4 em pixels
      height: 1123 // Altura A4 em pixels
    });

    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `Compartilhar ${fileName}`,
      filename: `${fileName}.pdf`
    });

    return uri;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
};