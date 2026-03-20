import { MetricCard } from '../components/MetricCard';
import { PageIntro } from '../components/PageIntro';
import { SectionCard } from '../components/SectionCard';

type CutoffMark = {
  concurso: string;
  cargo: string;
  vagas: string;
  nota1Lugar: string;
  notaAlvo: string;
  linkEdital: string;
};

const DATA: CutoffMark[] = [
  { concurso: 'Esteio/RS 2022', cargo: 'Analista de Sistemas', vagas: '1', nota1Lugar: '80.00', notaAlvo: '88.00', linkEdital: 'https://concursos-publicacoes.s3.amazonaws.com/642/publico/642_Edital_11_HomologaAAo_Final_Conc02_2021_624603f4f27c8.pdf?idpub=486287' },
  { concurso: 'COMUSA 2022', cargo: 'Analista de Sistemas', vagas: '1', nota1Lugar: '80.00', notaAlvo: '88.00', linkEdital: 'https://concursos-publicacoes.s3.amazonaws.com/728/publico/728_Edital_19-2023_HomologaAAoFinal_sem2Aetapa_6446865c33c2f.pdf?idpub=491313' },
  { concurso: 'COMUSA 2022', cargo: 'Técnico em Informática', vagas: '1', nota1Lugar: '82.50', notaAlvo: '90.50', linkEdital: 'https://concursos-publicacoes.s3.amazonaws.com/728/publico/728_Edital_19-2023_HomologaAAoFinal_sem2Aetapa_6446865c33c2f.pdf?idpub=491313' },
  { concurso: 'Passo Fundo 2024', cargo: 'Analista de Tecnologia da Informação', vagas: '1', nota1Lugar: '70.80', notaAlvo: '78.80', linkEdital: 'https://www.pmpf.rs.gov.br/transparencia/wp-content/uploads/sites/31/2024/12/concPublico2024-edital170-10122024.pdf' },
  { concurso: 'CAU/RS 2023', cargo: 'Analista Super. Desenvolvimento TIC', vagas: '1', nota1Lugar: '85.00', notaAlvo: '93.00', linkEdital: 'https://concursos-publicacoes.s3.amazonaws.com/771/publico/771_Edital_09-2023_EditalHomologaAAoFinal_64d647036fde5.pdf' },
  { concurso: 'CAU/RS 2023', cargo: 'Analista Super. Infraestrutura TIC', vagas: '1', nota1Lugar: '74.50', notaAlvo: '82.50', linkEdital: 'https://concursos-publicacoes.s3.amazonaws.com/771/publico/771_Edital_09-2023_EditalHomologaAAoFinal_64d647036fde5.pdf' },
  { concurso: 'CAU/RS 2023', cargo: 'Técnico em Microinformática', vagas: '1', nota1Lugar: '76.00', notaAlvo: '84.00', linkEdital: 'https://concursos-publicacoes.s3.amazonaws.com/771/publico/771_Edital_09-2023_EditalHomologaAAoFinal_64d647036fde5.pdf' },
  { concurso: 'CEASA/RS 2022', cargo: 'Técnico em Informática', vagas: '1', nota1Lugar: '66.00', notaAlvo: '74.00', linkEdital: 'https://concursos-publicacoes.s3.amazonaws.com/616/publico/616_Edital_17-2022_HomologaAAoFinal_Demaisempregos_62aa2d5ea6c40.pdf?idpub=487222' },
  { concurso: 'Casca/RS 2023', cargo: 'Analista de Informática', vagas: '1', nota1Lugar: '87.50', notaAlvo: '95.50', linkEdital: 'https://concursos-publicacoes.s3.amazonaws.com/727/publico/727_Edital_14-2022_Edital_Homologacao_Final_645e892f9cbd1.pdf?idpub=491655' },
  { concurso: 'Tapejara/RS 2023', cargo: 'Instrutor de Informática', vagas: '1', nota1Lugar: '70.00', notaAlvo: '78.00', linkEdital: 'https://concursos-publicacoes.s3.amazonaws.com/785/publico/785_Edital_11-2023_EditalHomologaAAoFinal-sem2Aetapa_65425b54522ad.pdf?idpub=494064' },
  { concurso: 'Baln. Barra do Sul/SC 2024', cargo: 'Analista de Informática', vagas: '1', nota1Lugar: '67.50', notaAlvo: '75.50', linkEdital: 'https://concursos-publicacoes.s3.amazonaws.com/885/publico/885_Edital_15-2024_EditalHomologaAAoFinal_66d21f2bb5428.pdf?idpub=499454' },
  { concurso: 'Sapucaia do Sul/RS 2024', cargo: 'Analista de Sistemas', vagas: '1', nota1Lugar: '82.50', notaAlvo: '90.50', linkEdital: 'https://concursos-publicacoes.s3.amazonaws.com/798/publico/798_Edital_18-2024_HomologaAAoFinal_65ce9374e305e.pdf?idpub=496015' },
];

const averageFirstPlace = (
  DATA.reduce((sum, row) => sum + Number(row.nota1Lugar), 0) / DATA.length
).toFixed(2);

const averageTarget = (
  DATA.reduce((sum, row) => sum + Number(row.notaAlvo), 0) / DATA.length
).toFixed(2);

export const CutoffMarksPage = () => {
  return (
    <section className="page">
      <PageIntro
        kicker="Benchmark de edital"
        title="Notas de Corte Fundatec"
        description='Análise de editais municipais e conselhos para cargos de TI. A "nota alvo" considera margem de +8 pontos sobre o primeiro colocado.'
      />

      <div className="grid-4">
        <MetricCard kicker="Amostra" title="Concursos" value={`${DATA.length}`} subtitle="base comparável" emphasis="blue" />
        <MetricCard kicker="Média" title="1º colocado" value={averageFirstPlace} subtitle="nota observada" emphasis="orange" />
        <MetricCard kicker="Meta" title="Nota alvo" value={averageTarget} subtitle="média com buffer" emphasis="green" />
        <MetricCard kicker="Perfil" title="Escopo" value="TI Fundatec" subtitle="municípios e conselhos" emphasis="blue" />
      </div>

      <SectionCard className="table-wrap" kicker="Tabela editorial" title="Histórico de notas de corte">
        <table className="table data-table">
          <thead>
            <tr>
              <th>Concurso</th>
              <th>Cargo</th>
              <th>Vagas</th>
              <th>Nota 1º Lugar</th>
              <th>Nota Alvo</th>
              <th>Edital</th>
            </tr>
          </thead>
          <tbody>
            {DATA.map((row) => (
              <tr key={`${row.concurso}-${row.cargo}`}>
                <td>
                  <strong>{row.concurso}</strong>
                </td>
                <td>{row.cargo}</td>
                <td>{row.vagas}</td>
                <td>{row.nota1Lugar}</td>
                <td className="cutoff-target-cell">{row.notaAlvo}</td>
                <td>
                  <a href={row.linkEdital} target="_blank" rel="noopener noreferrer" className="external-link">
                    Abrir PDF
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>
                <strong>Média geral</strong>
              </td>
              <td>{averageFirstPlace}</td>
              <td className="cutoff-target-cell">{averageTarget}</td>
              <td />
            </tr>
          </tfoot>
        </table>

        <p className="cutoff-footnote">
          O concurso da Prefeitura de Erechim 2022 não apresentou cargos exclusivos de TI com lista
          de aprovados na homologação final sem segunda etapa.
        </p>
      </SectionCard>
    </section>
  );
};
