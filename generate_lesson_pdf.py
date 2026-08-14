import os
import subprocess
import tempfile

def generate_html_lesson():
    html_content = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Aula Mestra LC nº 133/1985 Porto Alegre - Preparatório Anki / FUNDATEC</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;600;700;800&family=Fira+Code:wght@400;600&display=swap');

        @page {
            size: A4;
            margin: 16mm 14mm 18mm 14mm;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            color: #1e293b;
            background-color: #ffffff;
            line-height: 1.6;
            font-size: 10pt;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        /* --- COVER PAGE --- */
        .cover-page {
            min-height: 92vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            page-break-after: always;
            padding: 32px;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #1e1b4b 100%);
            color: #ffffff;
            border-radius: 16px;
        }

        .cover-header {
            border-bottom: 2px solid rgba(255,255,255,0.15);
            padding-bottom: 24px;
        }

        .cover-badge {
            display: inline-block;
            background: #2563eb;
            color: #ffffff;
            font-size: 9.5pt;
            font-weight: 800;
            padding: 6px 18px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 18px;
        }

        .cover-title {
            font-family: 'Outfit', sans-serif;
            font-size: 30pt;
            font-weight: 800;
            line-height: 1.15;
            color: #f8fafc;
            margin-bottom: 14px;
        }

        .cover-subtitle {
            font-size: 13.5pt;
            font-weight: 400;
            color: #cbd5e1;
            max-width: 95%;
            line-height: 1.45;
        }

        .cover-body {
            margin: 35px 0;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 14px;
            padding: 28px;
        }

        .cover-features {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 22px;
        }

        .feature-item {
            display: flex;
            align-items: flex-start;
            gap: 14px;
        }

        .feature-icon {
            background: #2563eb;
            color: #ffffff;
            width: 38px;
            height: 38px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14pt;
            flex-shrink: 0;
        }

        .feature-text h4 {
            font-size: 11.5pt;
            color: #f1f5f9;
            margin-bottom: 4px;
            font-weight: 700;
        }

        .feature-text p {
            font-size: 9.5pt;
            color: #94a3b8;
            line-height: 1.4;
        }

        .cover-footer {
            border-top: 1px solid rgba(255,255,255,0.15);
            padding-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9.5pt;
            color: #94a3b8;
        }

        /* --- LESSON TYPOGRAPHY & LAYOUT --- */
        .module-section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }

        .module-header {
            background: linear-gradient(90deg, #0f172a 0%, #1e293b 100%);
            color: #ffffff;
            padding: 12px 18px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 18px;
            border-left: 6px solid #2563eb;
        }

        .module-title {
            font-family: 'Outfit', sans-serif;
            font-size: 15pt;
            font-weight: 700;
            color: #f8fafc;
        }

        .module-tag {
            font-size: 8.5pt;
            font-weight: 700;
            background: rgba(255,255,255,0.15);
            padding: 3px 10px;
            border-radius: 12px;
            color: #93c5fd;
            text-transform: uppercase;
        }

        h3.topic-title {
            font-family: 'Outfit', sans-serif;
            font-size: 12.5pt;
            font-weight: 700;
            color: #0f172a;
            margin: 16px 0 8px 0;
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 4px;
        }

        p.text-p {
            font-size: 10pt;
            color: #334155;
            margin-bottom: 10px;
            text-align: justify;
            line-height: 1.55;
        }

        /* --- BOXES & CALLOUTS --- */
        .fundatec-box {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-left: 5px solid #2563eb;
            border-radius: 8px;
            padding: 14px 16px;
            margin: 14px 0;
        }

        .fundatec-box .box-title {
            font-size: 9pt;
            font-weight: 800;
            color: #1e40af;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .fundatec-box .box-content {
            font-size: 9.5pt;
            color: #1e3a8a;
            line-height: 1.5;
        }

        .trap-box {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-left: 5px solid #dc2626;
            border-radius: 8px;
            padding: 14px 16px;
            margin: 14px 0;
        }

        .trap-box .box-title {
            font-size: 9pt;
            font-weight: 800;
            color: #991b1b;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .trap-box .box-content {
            font-size: 9.5pt;
            color: #7f1d1d;
            line-height: 1.5;
        }

        .case-box {
            background: #fffbe6;
            border: 1px solid #fef08a;
            border-left: 5px solid #d97706;
            border-radius: 8px;
            padding: 14px 16px;
            margin: 14px 0;
        }

        .case-box .box-title {
            font-size: 9pt;
            font-weight: 800;
            color: #b45309;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 6px;
        }

        .case-box .box-content {
            font-size: 9.5pt;
            color: #78350f;
            line-height: 1.5;
        }

        /* --- COMPARATIVE TABLES --- */
        .custom-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
            margin: 14px 0;
        }

        .custom-table th {
            background: #0f172a;
            color: #ffffff;
            padding: 10px 12px;
            text-align: left;
            font-weight: 700;
            font-size: 8.5pt;
            text-transform: uppercase;
        }

        .custom-table td {
            padding: 9px 12px;
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
        }

        .custom-table tr:nth-child(even) {
            background-color: #f8fafc;
        }

        .highlight-badge {
            display: inline-block;
            background: #dbeafe;
            color: #1e40af;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 8.5pt;
        }

        /* --- QUIZ SECTION --- */
        .quiz-item {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            padding: 16px;
            margin-bottom: 16px;
            page-break-inside: avoid;
        }

        .quiz-question {
            font-size: 10.5pt;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 10px;
        }

        .quiz-options {
            list-style: none;
            margin-left: 0;
            margin-bottom: 10px;
        }

        .quiz-options li {
            font-size: 9.5pt;
            color: #334155;
            padding: 4px 8px;
            margin-bottom: 4px;
            border-radius: 4px;
        }

        .quiz-answer-comment {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 10px 12px;
            border-radius: 6px;
            font-size: 9pt;
            color: #14532d;
            margin-top: 8px;
        }
    </style>
</head>
<body>

    <!-- CAPA DA AULA MESTRA -->
    <div class="cover-page">
        <div class="cover-header">
            <span class="cover-badge">AULA DE ELITE & GUIA PRÉ-ANKI</span>
            <h1 class="cover-title">Dominando a LC nº 133/1985 de Porto Alegre</h1>
            <p class="cover-subtitle">Manual Educativo de Alto Rendimento com Análise de Tendências e Pegadinhas da Banca FUNDATEC</p>
        </div>

        <div class="cover-body">
            <div class="cover-features">
                <div class="feature-item">
                    <div class="feature-icon">🎯</div>
                    <div class="feature-text">
                        <h4>Foco no Estilo FUNDATEC</h4>
                        <p>Desmistificação do perfil da banca: literalidade dos artigos, prazos exatos e questões de "EXCETO".</p>
                    </div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">⚡</div>
                    <div class="feature-text">
                        <h4>Blindagem Anti-Pegadinha</h4>
                        <p>Confronto direto entre a LC 133/85 de Porto Alegre e a Lei Federal 8.112/90 para não errar no gabarito.</p>
                    </div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🏛️</div>
                    <div class="feature-text">
                        <h4>Casos Práticos Municipais</h4>
                        <p>Situações reais vivenciadas por servidores de Porto Alegre em secretarias e autarquias (HPS, DMLU, SMOV, DMAE).</p>
                    </div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🧠</div>
                    <div class="feature-text">
                        <h4>Preparatório Pré-Anki</h4>
                        <p>Construção do modelo mental e ancoragem conceitual completa antes do treino ativo nos Flashcards.</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="cover-footer">
            <span>Legislação Municipal de Porto Alegre</span>
            <span>Elaborado por IA de Engenharia Pedagógica</span>
            <span>Ano 2026</span>
        </div>
    </div>

    <!-- MÓDULO 1: O PERFIL DA FUNDATEC -->
    <div class="module-section">
        <div class="module-header">
            <span class="module-title">MÓDULO 01 — O Perfil Secreto da Banca FUNDATEC</span>
            <span class="module-tag">Estratégia de Prova</span>
        </div>

        <p class="text-p">
            A <strong>FUNDATEC</strong> é a principal banca organizadora de concursos públicos no Estado do Rio Grande do Sul e frequentemente é contratada pelo Município de Porto Alegre. Para ser aprovado, você não precisa apenas ler a lei seca: você precisa compreender <strong>como a FUNDATEC constrói a questão</strong> e onde ela esconde as armadilhas para eliminar candidatos desatentos.
        </p>

        <h3 class="topic-title">📌 As 4 Marcas Registradas da FUNDATEC na LC nº 133/1985</h3>
        <p class="text-p">
            Analisando o histórico de provas para Porto Alegre e prefeituras gaúchas, identificamos quatro padrões recorrentes:
        </p>

        <table class="custom-table">
            <thead>
                <tr>
                    <th style="width: 25%;">Padrão de Questão</th>
                    <th style="width: 45%;">Como a FUNDATEC Cobra</th>
                    <th style="width: 30%;">Sua Estratégia de Defesa</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>1. Literalidade Numérica</strong></td>
                    <td>Troca prazos exatos por números parecidos (ex: troca 52m30s por 50m; troca 2 períodos de férias por 3).</td>
                    <td>Decorar a <em>trinca numérica</em> de cada artigo de vantagens e licenças.</td>
                </tr>
                <tr>
                    <td><strong>2. Questões de "EXCETO"</strong></td>
                    <td>Apresenta 4 alternativas copiadas da lei e 1 com uma palavra alterada.</td>
                    <td>Sublinhar a palavra-chave de cada opção antes de marcar a incorreta.</td>
                </tr>
                <tr>
                    <td><strong>3. Estudos de Caso Fáticos</strong></td>
                    <td>Cria histórias curtas: <em>"Servidor João praticou X conduta..."</em> e pergunta a sanção ou validade.</td>
                    <td>Visualizar a conduta e identificar imediatamente o órgão e a competência.</td>
                </tr>
                <tr>
                    <td><strong>4. Pegadinha com a Lei 8.112</strong></td>
                    <td>Insere regras federais (ex: posse por procuração) esperando que o candidato confunda as leis.</td>
                    <td>Lembrar que na LC 133/85 de Porto Alegre a <strong>Posse é Personalíssima</strong>.</td>
                </tr>
            </tbody>
        </table>

        <div class="trap-box">
            <div class="box-title">🚨 ALERTA DE OURO FUNDATEC: O Perigo da Lei 8.112/90!</div>
            <div class="box-content">
                Muitos concurseiros estudam Direito Administrativo focados na Lei Federal nº 8.112/90. A FUNDATEC sabe disso e coloca alternativas que estão <strong>certas na lei federal, mas ERRADAS na legislação de Porto Alegre</strong>. A maior de todas as pegadinhas é a **Posse por Procuração**: na União (8.112) ela é permitida, mas na LC 133/85 de Porto Alegre ela é **VEDADA (ato personalíssimo)**!
            </div>
        </div>
    </div>

    <!-- MÓDULO 2: PROVIMENTO, POSSE E INGRESSO -->
    <div class="module-section">
        <div class="module-header">
            <span class="module-title">MÓDULO 02 — O Ciclo de Ingresso do Servidor Municipal</span>
            <span class="module-tag">Provimento e Posse</span>
        </div>

        <p class="text-p">
            O ingresso no serviço público de Porto Alegre segue um rito formal rigoroso. Compreender a cronologia exata dos atos administrativos é fundamental para acertar os cards de Anki e as questões de prova.
        </p>

        <h3 class="topic-title">⚡ A Cronologia do Ingresso: Criar -> Selecionar -> Nomear -> Empossar -> Trabalhar</h3>

        <table class="custom-table">
            <thead>
                <tr>
                    <th style="width: 18%;">Fase</th>
                    <th style="width: 22%;">Ato / Instrumento</th>
                    <th style="width: 40%;">Conceito Legal na LC 133/1985</th>
                    <th style="width: 20%;">Dispositivo</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>1. Criação</strong></td>
                    <td><strong>LEI em sentido formal</strong></td>
                    <td>Reserva de lei. Nenhum cargo público municipal pode ser criado por decreto ou portaria.</td>
                    <td><span class="highlight-badge">Art. 3º</span></td>
                </tr>
                <tr>
                    <td><strong>2. Seleção</strong></td>
                    <td><strong>Concurso Público</strong></td>
                    <td>Processo democrático de provas ou provas e títulos para provimento de cargos efetivos. Validade de até 2 anos.</td>
                    <td><span class="highlight-badge">Art. 11</span></td>
                </tr>
                <tr>
                    <td><strong>3. Chamamento</strong></td>
                    <td><strong>Nomeação (DOPA)</strong></td>
                    <td>Ato administrativo de provimento que convoca o aprovado a ingressar no quadro.</td>
                    <td><span class="highlight-badge">Art. 11 e ss.</span></td>
                </tr>
                <tr>
                    <td><strong>4. Investidura</strong></td>
                    <td><strong>POSSE (Personalíssima)</strong></td>
                    <td>Aceitação expressa das atribuições, deveres e responsabilidades com assinatura do termo. VEDADA procuração.</td>
                    <td><span class="highlight-badge">Art. 22 a 26</span></td>
                </tr>
                <tr>
                    <td><strong>5. Atuação</strong></td>
                    <td><strong>EXERCÍCIO</strong></td>
                    <td>Efetivo e real desempenho das funções. Marca o início do vencimento e da contagem de tempo.</td>
                    <td><span class="highlight-badge">Art. 30</span></td>
                </tr>
            </tbody>
        </table>

        <div class="case-box">
            <div class="box-title">💡 CASO PRÁTICO ESTILO FUNDATEC: O Dilema de Carla no HPS</div>
            <div class="box-content">
                <strong>Enunciado:</strong> Carla foi nomeada no Diário Oficial de Porto Alegre para o cargo de Enfermeira do HPS. Estando em viagem no exterior, enviou uma procuração pública para seu marido assinar o termo de posse. O Diretor de Recursos Humanos indeferiu o ato. O indeferimento foi correto?<br>
                <strong>Solução da Aula:</strong> SIM, 100% CORRETO! Na LC 133/85 de Porto Alegre, a posse exige a presença física do candidato (ato personalíssimo). Procuração não é aceita no município.
            </div>
        </div>
    </div>

    <!-- MÓDULO 3: DIREITOS, VANTAGENS E REGIME DE TRABALHO -->
    <div class="module-section">
        <div class="module-header">
            <span class="module-title">MÓDULO 03 — Direitos, Vantagens e Regime de Trabalho</span>
            <span class="module-tag">Vantagens e Licenças</span>
        </div>

        <p class="text-p">
            Este é o módulo favorito da FUNDATEC para elaborar questões com números, prazos e percentuais. Abaixo estão os quatro pilares de vantagens financeiras e de jornada que você deve memorizar antes dos cards do Anki:
        </p>

        <h3 class="topic-title">💰 Quadro de Resumo de Vantagens e Jornadas de Porto Alegre</h3>

        <table class="custom-table">
            <thead>
                <tr>
                    <th style="width: 25%;">Vantagem / Direito</th>
                    <th style="width: 55%;">Regra de Ouro da LC nº 133/1985</th>
                    <th style="width: 20%;">Dispositivo</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Fracionamento de Férias</strong></td>
                    <td>Pode ser dividido em <strong>no máximo 2 períodos</strong>. Condição: nenhum período pode ser menor que <strong>10 dias</strong>.</td>
                    <td><span class="highlight-badge">Art. 81</span></td>
                </tr>
                <tr>
                    <td><strong>Gratificação Natalina (13º)</strong></td>
                    <td>Calculada em <strong>1/12 da remuneração de DEZEMBRO</strong> por mês trabalhado. Fração >= 15 dias conta como mês cheio.</td>
                    <td><span class="highlight-badge">Art. 98</span></td>
                </tr>
                <tr>
                    <td><strong>Trabalho Noturno e Hora Ficta</strong></td>
                    <td>Horário noturno: <strong>22h às 5h</strong>. Duração ficta da hora noturna: <strong>52 minutos e 30 segundos</strong> (7/8 da hora).</td>
                    <td><span class="highlight-badge">Art. 41, parágrafo único</span></td>
                </tr>
                <tr>
                    <td><strong>Readaptação Funcional</strong></td>
                    <td>Investidura em cargo afim por limitação de saúde. <strong>JAMAIS pode haver redução remuneratória!</strong></td>
                    <td><span class="highlight-badge">Arts. 57 a 60</span></td>
                </tr>
                <tr>
                    <td><strong>Indenização por Diárias</strong></td>
                    <td>Concedida para cobrir <strong>despesas de pousada e alimentação</strong> em deslocamento transitório fora da sede.</td>
                    <td><span class="highlight-badge">Art. 88</span></td>
                </tr>
                <tr>
                    <td><strong>Curso no Exterior com Remuneração</strong></td>
                    <td>Exige 3 requisitos: 1) Servidor <strong>Estável</strong>; 2) Autorização do <strong>Prefeito</strong>; 3) <strong>Interesse direto do Município</strong>.</td>
                    <td><span class="highlight-badge">Art. 32, II e III</span></td>
                </tr>
            </tbody>
        </table>

        <div class="fundatec-box">
            <div class="box-title">🎯 DICA DE FIXAÇÃO: Como a FUNDATEC cobra a Hora Noturna?</div>
            <div class="box-content">
                A banca vai dizer: <em>"A hora noturna no Município de Porto Alegre é computada como de 50 minutos e vai das 20h às 6h."</em> <strong>FALSO!</strong> Lembre-se sempre dos dois números exatos: <strong>22h às 5h</strong> e <strong>52 minutos e 30 segundos</strong>!
            </div>
        </div>
    </div>

    <!-- MÓDULO 4: REGIME DISCIPLINAR E PROCESSOS -->
    <div class="module-section">
        <div class="module-header">
            <span class="module-title">MÓDULO 04 — Regime Disciplinar, Punições e Processos</span>
            <span class="module-tag">Disciplina e PAD</span>
        </div>

        <p class="text-p">
            O regime disciplinar impõe aos servidores deveres éticos e sujeição a punições. Em Porto Alegre, a obediência hierárquica é moderada e as punições graves possuem autoridade exclusiva.
        </p>

        <h3 class="topic-title">⚖️ Obediência Hierárquica, Sindicância e Penalidades</h3>

        <div class="case-box">
            <div class="box-title">⚖️ CONCEITO CHAVE: Obediência Hierárquica Atenuada (Art. 177, IV)</div>
            <div class="box-content">
                O funcionário público municipal DEVE cumprir as ordens dos seus superiores. <strong>EXCEÇÃO ABSOLUTA: Ordens manifestamente ilegais!</strong> Perante uma ordem manifestamente ilegal (ex: fraude ou crime), o servidor tem o dever legal de <strong>recusar o cumprimento</strong> e representar imediatamente à autoridade superior.
            </div>
        </div>

        <table class="custom-table">
            <thead>
                <tr>
                    <th style="width: 30%;">Procedimento / Pena</th>
                    <th style="width: 50%;">Hipótese de Aplicação e Regra Especial</th>
                    <th style="width: 20%;">Dispositivo</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Sindicância</strong></td>
                    <td>Procedimento preliminar sumário de investigação. Usada quando a autoria é incerta ou o fato é duvidoso.</td>
                    <td><span class="highlight-badge">Arts. 196 e ss.</span></td>
                </tr>
                <tr>
                    <td><strong>PAD (Processo Disciplinar)</strong></td>
                    <td>Instaurado quando há acusação formal com autoria conhecida e infração sujeita a penalidades graves.</td>
                    <td><span class="highlight-badge">Arts. 196 e ss.</span></td>
                </tr>
                <tr>
                    <td><strong>Demissão e Cassação</strong></td>
                    <td>Penalidades disciplinares máximas. <strong>Competência EXCLUSIVA E PRIVATIVA DO PREFEITO MUNICIPAL</strong>.</td>
                    <td><span class="highlight-badge">Art. 200, I</span></td>
                </tr>
                <tr>
                    <td><strong>Rito da Representação</strong></td>
                    <td>Dirigida à autoridade superior, mas protocolada via chefia imediata (que tem até 5 dias para remeter).</td>
                    <td><span class="highlight-badge">Art. 189</span></td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- MÓDULO 5: DEVERES E PRIORIDADES -->
    <div class="module-section">
        <div class="module-header">
            <span class="module-title">MÓDULO 05 — Deveres e Prioridades Absolutas de Atendimento</span>
            <span class="module-tag">Art. 196, XVIII</span>
        </div>

        <p class="text-p">
            A LC nº 133/1985 estabelece uma lista de deveres do funcionário público municipal. Dentre eles, há um dispositivo de altíssima incidência nas provas da FUNDATEC: a <strong>Trinca de Atendimento Pronto e Preferencial</strong>.
        </p>

        <div class="fundatec-box">
            <div class="box-title">🏆 A TRINCA DE OURO DO ATENDIMENTO PREFERENCIAL (Art. 196, XVIII)</div>
            <div class="box-content">
                Nas repartições municipais de Porto Alegre, três requisições/pedidos devem furar a fila e receber despacho imediato:
                <br><br>
                1. <strong>Pedidos de Certidões</strong> formulados por cidadãos para defesa de direitos.<br>
                2. <strong>Requisições de Informações da CÂMARA MUNICIPAL</strong> de Porto Alegre.<br>
                3. <strong>Diligências para Defesa da FAZENDA MUNICIPAL</strong> em juízo ou instrução de <strong>PAD</strong>.
            </div>
        </div>
    </div>

    <!-- MÓDULO 6: TESTE DE FIXAÇÃO ESTILO FUNDATEC (PRÉ-ANKI) -->
    <div class="module-section">
        <div class="module-header">
            <span class="module-title">MÓDULO 06 — Simulado de Fixação Pré-Anki (Estilo FUNDATEC)</span>
            <span class="module-tag">Autoavaliação</span>
        </div>

        <p class="text-p">
            Antes de iniciar a memorização ativa no Anki, responda às 4 questões inéditas formuladas exatamente no padrão da banca FUNDATEC para testar sua ancoragem teórica:
        </p>

        <!-- QUESTÃO 1 -->
        <div class="quiz-item">
            <div class="quiz-question">
                1. (FUNDATEC Adaptada) Quanto ao ato de investidura no cargo público previsto na LC nº 133/1985 do Município de Porto Alegre, assinale a alternativa CORRETA:
            </div>
            <ul class="quiz-options">
                <li>(A) A posse poderá dar-se mediante procuração com poderes específicos, caso o empossado esteja no exterior.</li>
                <li>(B) A posse é o ato formal de aceitação das atribuições e deveres do cargo, de natureza personalíssima, vedada a procuração.</li>
                <li>(C) O exercício precede a posse na ordem cronológica de provimento.</li>
                <li>(D) A posse por procuração simples é permitida apenas para cargos de provimento em comissão.</li>
            </ul>
            <div class="quiz-answer-comment">
                <strong>Gabarito: (B)</strong><br>
                <em>Comentário:</em> Na LC nº 133/1985 de Porto Alegre (Arts. 22 a 26), a posse é ato personalíssimo e a legislação municipal NÃO prevê a posse por procuração. A alternativa A traz a regra da Lei Federal 8.112/90 (pegadinha clássica da FUNDATEC!).
            </div>
        </div>

        <!-- QUESTÃO 2 -->
        <div class="quiz-item">
            <div class="quiz-question">
                2. (FUNDATEC Adaptada) Em relação aos direitos e vantagens dos funcionários de Porto Alegre, analise as assertivas e assinale a alternativa que contém apenas as VERDADEIRAS:
                <br><br>
                I. As férias podem ser fracionadas em até 2 períodos, desde que nenhum seja inferior a 10 dias.<br>
                II. A hora noturna (22h às 5h) possui duração ficta de 52 minutos e 30 segundos.<br>
                III. A readaptação em cargo compatível com a limitação de saúde do servidor pode acarretar redução proporcional da remuneração.
            </div>
            <ul class="quiz-options">
                <li>(A) Apenas I e II.</li>
                <li>(B) Apenas II e III.</li>
                <li>(C) Apenas I e III.</li>
                <li>(D) I, II e III.</li>
            </ul>
            <div class="quiz-answer-comment">
                <strong>Gabarito: (A)</strong><br>
                <em>Comentário:</em> As assertivas I (Art. 81) e II (Art. 41) estão corretas. A assertiva III é FALSO: a readaptação jamais pode acarretar redução remuneratória (Art. 58 da LC 133/85).
            </div>
        </div>

        <!-- QUESTÃO 3 -->
        <div class="quiz-item">
            <div class="quiz-question">
                3. (FUNDATEC Adaptada) Um servidor público da Secretaria de Obras de Porto Alegre recebe uma ordem verbal de seu superior hierárquico determinando o atesto de uma medição de serviços não executados. De acordo com a LC nº 133/1985, a conduta correta do servidor é:
            </div>
            <ul class="quiz-options">
                <li>(A) Cumprir a ordem e posteriormente recorrer ao sindicato.</li>
                <li>(B) Cumprir a ordem mediante confirmação por escrito do chefe.</li>
                <li>(C) Recusar o cumprimento da ordem por ser manifestamente ilegal e representar à autoridade superior.</li>
                <li>(D) Aguardar abertura de sindicância para se manifestar.</li>
            </ul>
            <div class="quiz-answer-comment">
                <strong>Gabarito: (C)</strong><br>
                <em>Comentário:</em> Nos termos do Art. 177, IV da LC 133/85, o servidor deve cumprir as ordens superiores, EXCETO quando manifestamente ilegais, hipótese em que deve recusar e representar.
            </div>
        </div>

        <!-- QUESTÃO 4 -->
        <div class="quiz-item">
            <div class="quiz-question">
                4. (FUNDATEC Adaptada) A penalidade disciplinar de demissão de um funcionário estável do Município de Porto Alegre é de competência privativa de qual autoridade?
            </div>
            <ul class="quiz-options">
                <li>(A) Do Secretário Municipal da pasta correspondente.</li>
                <li>(B) Do Presidente da Comissão de Processo Disciplinar.</li>
                <li>(C) Do Procurador-Geral do Município.</li>
                <li>(D) Do Prefeito Municipal.</li>
            </ul>
            <div class="quiz-answer-comment">
                <strong>Gabarito: (D)</strong><br>
                <em>Comentário:</em> Nos termos do Art. 200, I da LC nº 133/1985, as penas gravosas de demissão e cassação de aposentadoria/disponibilidade são de competência EXCLUSIVA do Prefeito Municipal.
            </div>
        </div>
    </div>

</body>
</html>
"""
    return html_content

if __name__ == "__main__":
    html_out = "Aula_Mestra_LC133_Porto_Alegre_FUNDATEC.html"
    pdf_out = "Aula_Mestra_LC133_Porto_Alegre_FUNDATEC.pdf"
    
    # Write HTML file
    with open(html_out, "w", encoding="utf-8") as f:
        f.write(generate_html_lesson())
    print(f"HTML da Aula Gerado: {html_out}")

    # Compile to PDF using Edge headless
    tmp_user_data = tempfile.mkdtemp()
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    cmd = [
        edge_path,
        "--headless",
        "--disable-gpu",
        f"--user-data-dir={tmp_user_data}",
        f"--print-to-pdf={os.path.abspath(pdf_out)}",
        "--no-pdf-header-footer",
        os.path.abspath(html_out)
    ]
    subprocess.run(cmd, check=True)
    if os.path.exists(pdf_out):
        print(f"PDF da Aula Gerado com Sucesso: {pdf_out} ({os.path.getsize(pdf_out)} bytes)")
    else:
        print("Erro na geração do PDF da Aula.")
