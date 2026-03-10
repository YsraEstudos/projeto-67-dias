import React from 'react';

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

export const CutoffMarksPage = () => {
    return (
        <div className="page-container">
            <div className="page-header">
                <h2 className="title">Notas de Corte Fundatec (1º Colocado)</h2>
                <p className="subtitle">
                    Análise de editais municipais/conselhos para cargos de TI.
                    A "Nota Alvo" é a meta calculada (+8 pontos da nota do 1º colocado).
                </p>
            </div>

            <div className="content-card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Concurso</th>
                            <th>Cargo</th>
                            <th>Vagas</th>
                            <th>Nota 1º Lugar</th>
                            <th>Nota Alvo (Meta +8)</th>
                            <th>Link do Edital</th>
                        </tr>
                    </thead>
                    <tbody>
                        {DATA.map((row, index) => (
                            <tr key={index}>
                                <td><strong>{row.concurso}</strong></td>
                                <td>{row.cargo}</td>
                                <td style={{ textAlign: 'center' }}>{row.vagas}</td>
                                <td style={{ textAlign: 'center' }}>{row.nota1Lugar}</td>
                                <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--color-primary)' }}>{row.notaAlvo}</td>
                                <td>
                                    <a href={row.linkEdital} target="_blank" rel="noopener noreferrer" className="external-link">
                                        Abrir PDF
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ background: 'var(--bg-card-alt)' }}>
                            <td colSpan={3} style={{ textAlign: 'right', paddingRight: '1rem' }}><strong>MÉDIA GERAL (12 cargos)</strong></td>
                            <td style={{ textAlign: 'center' }}><strong>76.86</strong></td>
                            <td style={{ textAlign: 'center', color: 'var(--color-primary)' }}><strong>84.86</strong></td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>

                <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    * O concurso da Prefeitura de Erechim 2022 não apresentou cargos exclusivos de TI com lista de aprovados na homologação final sem 2ª etapa.
                </div>
            </div>
        </div>
    );
};
