import os
import subprocess
import tempfile

def generate_clean_html():
    html_content = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Estatuto dos Funcionários Públicos de Porto Alegre (LC nº 133/1985) - Texto Explicativo</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600;700&display=swap');

        @page {
            size: A4;
            margin: 22mm 20mm 22mm 20mm;
            @top-center {
                content: "Estatuto dos Funcionários Públicos de Porto Alegre (LC nº 133/1985) — Guia Explicativo";
                font-family: 'Inter', sans-serif;
                font-size: 8.5pt;
                color: #64748b;
                border-bottom: 1px solid #e2e8f0;
                padding-bottom: 5px;
            }
            @bottom-right {
                content: "Página " counter(page) " de " counter(pages);
                font-family: 'Inter', sans-serif;
                font-size: 8.5pt;
                color: #64748b;
            }
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Lora', Georgia, serif;
            color: #1c1917;
            background-color: #ffffff;
            line-height: 1.7;
            font-size: 11pt;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        /* --- COVER & TITLE --- */
        .title-block {
            text-align: center;
            padding: 40px 10px 30px 10px;
            border-bottom: 2px solid #1c1917;
            margin-bottom: 35px;
        }

        .doc-category {
            font-family: 'Inter', sans-serif;
            font-size: 9pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #0369a1;
            margin-bottom: 12px;
        }

        .doc-title {
            font-size: 26pt;
            font-weight: 700;
            color: #0f172a;
            line-height: 1.25;
            margin-bottom: 14px;
        }

        .doc-subtitle {
            font-family: 'Inter', sans-serif;
            font-size: 12pt;
            font-weight: 400;
            color: #475569;
            max-width: 85%;
            margin: 0 auto;
            line-height: 1.5;
        }

        .doc-meta {
            font-family: 'Inter', sans-serif;
            font-size: 9pt;
            color: #64748b;
            margin-top: 20px;
            font-style: italic;
        }

        /* --- CHAPTER & SECTION HEADINGS --- */
        h2.chapter-title {
            font-family: 'Inter', sans-serif;
            font-size: 16pt;
            font-weight: 700;
            color: #0f172a;
            margin: 32px 0 14px 0;
            padding-bottom: 6px;
            border-bottom: 1.5px solid #0f172a;
            page-break-after: avoid;
        }

        h3.section-title {
            font-family: 'Inter', sans-serif;
            font-size: 13pt;
            font-weight: 600;
            color: #1e293b;
            margin: 22px 0 10px 0;
            page-break-after: avoid;
        }

        p {
            margin-bottom: 14px;
            text-align: justify;
            text-indent: 1.5em;
        }

        p.no-indent {
            text-indent: 0;
        }

        /* --- HUMAN NARRATIVE EXAMPLES --- */
        .example-story {
            background-color: #fafaf9;
            border-left: 3.5px solid #0284c7;
            padding: 14px 18px;
            margin: 18px 0;
            font-size: 10.5pt;
            color: #292524;
            border-radius: 0 6px 6px 0;
            page-break-inside: avoid;
        }

        .example-story .story-title {
            font-family: 'Inter', sans-serif;
            font-size: 9pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #0369a1;
            margin-bottom: 6px;
        }

        /* --- LAW COMPARISON / TRAP ALERTS --- */
        .law-note {
            background-color: #fffbeeb;
            background-color: #fefce8;
            border: 1px solid #fef08a;
            border-left: 3.5px solid #ca8a04;
            padding: 14px 18px;
            margin: 18px 0;
            font-size: 10pt;
            color: #713f12;
            border-radius: 0 6px 6px 0;
            page-break-inside: avoid;
        }

        .law-note .note-title {
            font-family: 'Inter', sans-serif;
            font-size: 9pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #a16207;
            margin-bottom: 6px;
        }

        /* --- HIGHLIGHT TEXT --- */
        strong {
            color: #0f172a;
        }

        .quote-block {
            font-style: italic;
            color: #44402c;
            padding-left: 20px;
            border-left: 2px solid #a8a29e;
            margin: 14px 0;
        }

        /* --- SUMMARY BULLETS --- */
        ul.clean-list {
            margin: 10px 0 16px 25px;
        }

        ul.clean-list li {
            margin-bottom: 6px;
            text-align: justify;
        }
    </style>
</head>
<body>

    <!-- CABEÇALHO DO DOCUMENTO -->
    <div class="title-block">
        <div class="doc-category">Estatuto dos Funcionários Públicos de Porto Alegre</div>
        <h1 class="doc-title">Compreendendo a LC nº 133/1985 na Prática</h1>
        <p class="doc-subtitle">Um guia claro, narrativo e detalhado para entender as regras, a lógica e o cotidiano do serviço público municipal antes dos estudos no Anki</p>
        <div class="doc-meta">Por um Especialista em Direito Administrativo Municipal • Atualizado e Auditado</div>
    </div>

    <!-- CAPÍTULO 1 -->
    <h2 class="chapter-title">1. Por que existe um Estatuto e como se criam os cargos?</h2>
    
    <p>
        Quando pensamos em trabalhar na iniciativa privada, a regra do jogo é a CLT (Consolidação das Leis do Trabalho). Na prefeitura, contudo, a lógica é completamente diferente. O funcionário público municipal de Porto Alegre não assina uma carteira de trabalho: ele se submete a um **regime estatutário**, criado por uma lei própria do município — a <strong>Lei Complementar nº 133, de 29 de julho de 1985</strong>.
    </p>

    <p>
        Essa lei é o código de conduta, a garantia de direitos e a bíblia de deveres de todos os servidores estatutários da capital gaúcha. Uma das regras mais estruturais do estatuto está no seu <strong>Artigo 3º</strong>, que consagra o chamado <em>Princípio da Reserva de Lei</em>. Ele determina que <strong>todo cargo público municipal só pode ser criado por LEI</strong> em sentido formal, aprovada pela Câmara de Vereadores de Porto Alegre e sancionada pelo Prefeito.
    </p>

    <p>
        Isso significa que, se a Secretaria Municipal de Saúde estiver precisando urgentemente de mais médicos ou a Secretaria de Educação precisar de professores, o Prefeito de Porto Alegre <em>jamais poderá criar novos cargos expedindo um simples Decreto Executivo ou Portaria</em>. Ele é obrigado a elaborar um Projeto de Lei, enviá-lo ao Poder Legislativo municipal e aguardar a aprovação dos vereadores. O Decreto só pode ser usado para reorganizar a estrutura interna ou extinguir cargos que já estejam vagos.
    </p>

    <!-- CAPÍTULO 2 -->
    <h2 class="chapter-title">2. Do Concurso à Entrada no Trabalho: O Caminho da Investidura</h2>

    <p>
        Para ingressar em um cargo efetivo na Prefeitura de Porto Alegre, o cidadão precisa passar pelo <strong>Concurso Público</strong> (Art. 11), que pode ser de provas ou de provas e títulos. O concurso tem validade de até dois anos, podendo ser prorrogado uma única vez por igual período. A aprovação gera o direito de ser nomeado dentro das vagas do edital.
    </p>

    <p>
        O ciclo de ingresso no serviço público municipal possui três momentos jurídicos bem definidos que costumam ser confundidos por quem está começando a estudar:
    </p>

    <ul class="clean-list">
        <li><strong>Nomeação:</strong> É o ato administrativo unilateral publicado no Diário Oficial de Porto Alegre (DOPA). É a convocação oficial do aprovado para apresentar seus documentos e exames médicos.</li>
        <li><strong>Posse (Art. 22):</strong> É a aceitação expressa das atribuições, deveres e responsabilidades do cargo. É o momento solene em que o cidadão assina o Termo de Posse e assume o compromisso de bem servir. É a posse que realiza a <em>investidura</em> no cargo público.</li>
        <li><strong>Exercício (Art. 30):</strong> É a prática real, diária e concreta do trabalho. Começar a trabalhar é entrar em exercício. É a data do exercício que dispara a contagem para o recebimento do primeiro salário e para o tempo de serviço.</li>
    </ul>

    <h3 class="section-title">A Regra Fundamental da Posse em Porto Alegre: Ato Personalíssimo</h3>

    <p>
        Aqui está um dos pontos mais importantes e cobrados em provas sobre Porto Alegre. No estatuto federal (Lei 8.112/90), a lei permite que o aprovado tome posse por procuração com poderes especiais caso esteja viajando ou impossibilitado. <strong>Porém, na LC nº 133/1985 de Porto Alegre, NÃO existe previsão para posse por procuração.</strong>
    </p>

    <p>
        Em Porto Alegre, a posse é entendida como um <strong>ato personalíssimo</strong>. O cidadão nomeado deve comparecer pessoalmente perante o órgão de Recursos Humanos do Município para assinar o termo e prestar o compromisso.
    </p>

    <div class="example-story">
        <div class="story-title">💡 Exemplo do Dia a Dia no HPS (Hospital de Pronto Socorro)</div>
        <p class="no-indent">
            Imagine que Juliana foi aprovada no concurso para Médica Traumatologista do HPS de Porto Alegre. No dia em que sua nomeação foi publicada no DOPA, ela estava participando de uma especialização na Espanha. Sabendo que o prazo de posse estava correndo, Juliana fez uma procuração pública em cartório dando poderes para seu irmão assinar a posse em seu lugar na Secretaria Municipal de Administração. Ao chegar lá, o irmão foi informado de que a prefeitura não aceita posse por procuração. Juliana teve que comprar uma passagem de emergência e vir pessoalmente a Porto Alegre assinar o Termo de Posse, pois a LC 133/85 exige a presencialidade do empossado.
        </p>
    </div>

    <div class="law-note">
        <div class="note-title">🎯 Pegadinha de Concurso (FUNDATEC)</div>
        <p class="no-indent">
            As bancas adora testar se o candidato decorou a lei federal ou a lei municipal. Se a questão perguntar sobre o Estatuto de Porto Alegre (LC 133/85), a resposta é taxativa: <strong>a posse NÃO pode ser realizada por procuração</strong>.
        </p>
    </div>

    <!-- CAPÍTULO 3 -->
    <h2 class="chapter-title">3. Agrupamento de Cargos, Classe e Promoção</h2>

    <p>
        Para organizar a evolução do servidor ao longo dos anos, a LC nº 133/1985 estabelece conceitos claros sobre a estrutura da carreira:
    </p>

    <p>
        O <strong>Artigo 5º</strong> define <strong>Classe</strong> como o agrupamento de cargos da mesma profissão e de igual nível de complexidade e responsabilidade. Por exemplo: os cargos de Auditor Fiscal da Receita Municipal dividem-se em Classe A, Classe B e Classe C. O servidor aprovado no concurso inicia sua trajetória na Classe A (classe inicial).
    </p>

    <p>
        A passagem do funcionário de uma classe para a classe imediatamente superior dentro da mesma carreira chama-se <strong>PROMOÇÃO</strong>. A promoção ocorre alternadamente por dois critérios: <strong>antiguidade</strong> (tempo de serviço na classe) e <strong>merecimento</strong> (avaliação periódica de desempenho). Já o <strong>Quadro</strong> (Art. 6º) representa o conjunto total de cargos de todos os órgãos e secretarias da Prefeitura.
    </p>

    <!-- CAPÍTULO 4 -->
    <h2 class="chapter-title">4. Direitos, Vantagens e a Vida Prática do Servidor</h2>

    <p>
        O estatuto municipal assegura uma série de direitos e vantagens pecuniárias para garantir a dignidade e a recomposição das energias do funcionário público. Vamos analisar em detalhes como funciona cada um deles no dia a dia:
    </p>

    <h3 class="section-title">A) Férias e seu Fracionamento (Art. 81)</h3>
    <p>
        Após cada período de 12 meses de efetivo trabalho (período aquisitivo), o funcionário ganha o direito a 30 dias consecutivos de férias remuneradas. A lei de Porto Alegre autoriza o servidor a fracionar esse descanso para conciliar suas necessidades pessoais com a rotina da repartição. Contudo, há uma regra dupla que não pode ser descumprida: <strong>as férias só podem ser fracionadas em no máximo 2 (dois) períodos, e nenhum desses períodos pode ser inferior a 10 (dez) dias corridos</strong>.
    </p>

    <div class="example-story">
        <div class="story-title">💡 Exemplo Prático na Secretaria de Urbanismo</div>
        <p class="no-indent">
            Lucas é arquiteto concursado da Prefeitura de Porto Alegre e quer planejar suas férias do ano. Ele pode solicitar 15 dias em janeiro e 15 dias em julho? Sim. Pode pedir 20 dias em março e 10 dias em novembro? Sim. Mas ele não poderia pedir 5 dias em janeiro, 10 em maio e 15 em dezembro, pois isso violaria tanto o limite de 2 etapas quanto o tamanho mínimo de 10 dias por período.
        </p>
    </div>

    <h3 class="section-title">B) Gratificação Natalina / 13º Salário (Art. 98)</h3>
    <p>
        A Gratificação Natalina corresponde a <strong>1/12 (um doze avos) da remuneração devida no mês de DEZEMBRO</strong> por cada mês de efetivo trabalho no ano civil. A lei estabelece que qualquer mês em que o funcionário tenha trabalhado por <strong>15 dias ou mais</strong> será computado como um mês integral (1/12).
    </p>

    <p>
        Note o detalhe financeiro: o cálculo não é feito pela média salarial do ano todo, mas sim com base no valor integral que o servidor estiver recebendo no mês de dezembro.
    </p>

    <h3 class="section-title">C) Trabalho Noturno e a Hora Ficta Reduzida (Art. 41)</h3>
    <p>
        O trabalho noturno é aquele realizado entre as <strong>22 horas de um dia e as 5 horas do dia seguinte</strong>. Devido ao desgaste biológico inerente ao trabalho durante a noite, a lei concede o adicional noturno e estabelece a <strong>duração ficta da hora noturna</strong>: cada hora de trabalho noturno computa-se como de <strong>52 minutos e 30 segundos</strong>.
    </p>

    <div class="example-story">
        <div class="story-title">💡 Exemplo Prático no Plantão Noturno do Presidente Vargas</div>
        <p class="no-indent">
            Um técnico em enfermagem do Hospital Materno Infantil Presidente Vargas cumpre plantão noturno das 22h às 5h da manhã. No relógio de parede da sala de plantão, passaram-se exatamente 7 horas. Porém, como cada hora noturna vale legalmente 52 minutos e 30 segundos (7/8 da hora normal), a folha de ponto do servidor registrará o cumprimento de 8 horas inteiras de trabalho.
        </p>
    </div>

    <h3 class="section-title">D) Readaptação Funcional sem Perda Salarial (Arts. 57 a 60)</h3>
    <p>
        A <strong>Readaptação</strong> ocorre quando o funcionário sofre uma limitação em sua saúde física ou mental (comprovada por laudo de junta médica oficial) que o impede de continuar exercendo as funções do seu cargo original. Nesses casos, ele é investido em outro cargo de atribuições compatíveis com sua nova condição de saúde.
    </p>

    <p>
        A regra de ouro garantida pelo <strong>Artigo 58</strong> é que <strong>a readaptação jamais pode acarretar redução na remuneração do servidor</strong>. Mesmo que o novo cargo de destino tenha um vencimento inicial menor na tabela municipal, o funcionário manterá integralmente o salário do seu cargo de origem.
    </p>

    <div class="example-story">
        <div class="story-title">💡 Exemplo Prático na Guarda Municipal</div>
        <p class="no-indent">
            Um Guarda Municipal de Porto Alegre sofre um acidente grave e perde parte da mobilidade das pernas, ficando impossibilitado de fazer patrulhamento a pé nas ruas e praças da capital. A junta médica da prefeitura determina a sua readaptação para o cargo de Agente Administrativo de atendimento telefônico. Embora o vencimento base inicial do cargo de agente seja inferior ao de guarda, o servidor continuará recebendo sua remuneração original sem qualquer desconto.
        </p>
    </div>

    <h3 class="section-title">E) Diárias por Deslocamento da Sede (Art. 88)</h3>
    <p>
        Quando o funcionário precisa se deslocar em caráter eventual ou temporário da cidade de Porto Alegre (sua sede de trabalho) para outro município ou estado a serviço da prefeitura, ele recebe uma indenização chamada <strong>Diária</strong>. A finalidade exclusiva da diária é cobrir as despesas extraordinárias de <strong>pousada (hotel) e alimentação</strong>. Por ter natureza indenizatória, a diária não se incorpora ao salário nem sofre desconto de imposto de renda.
    </p>

    <!-- CAPÍTULO 5 -->
    <h2 class="chapter-title">5. Afastamentos Especiais: O Estudo no Exterior</h2>

    <p>
        O estatuto de Porto Alegre valoriza a capacitação técnica dos seus quadros, permitindo que o servidor se afaste do país para realizar cursos de pós-graduação, mestrado ou doutorado mantendo seu salário integral (Art. 32, II e III). No entanto, esse benefício não é concedido de forma indiscriminada. A lei exige o preenchimento simultâneo de **três requisitos obrigatórios**:
    </p>

    <ul class="clean-list">
        <li><strong>1. Estabilidade:</strong> O servidor já deve ter cumprido o estágio probatório e ser estável no serviço público municipal.</li>
        <li><strong>2. Autorização do Prefeito:</strong> O ato de liberação deve ser assinado expressamente pelo Prefeito Municipal de Porto Alegre.</li>
        <li><strong>3. Interesse Direto do Serviço Público:</strong> O conteúdo do curso deve ter relação direta com as atribuições da secretaria onde o servidor atua.</li>
    </ul>

    <p>
        Além disso, como contrapartida ao investimento público, o servidor assume o compromisso de trabalhar na prefeitura após o retorno por um período no mínimo igual ao tempo em que permaneceu afastado no exterior.
    </p>

    <!-- CAPÍTULO 6 -->
    <h2 class="chapter-title">6. Regime Disciplinar: Deveres, Hierarquia e Limites</h2>

    <p>
        O conjunto de deveres do funcionário está descrito a partir do <strong>Artigo 177</strong>. O funcionário deve agir com lealdade, presteza, assiduidade e urbanidade. No entanto, no tocante à hierarquia, o direito administrativo aplica a regra da <em>obediência atenuada</em>.
    </p>

    <h3 class="section-title">O Dever de Obediência e a Exceção das Ordens Ilegais</h3>
    <p>
        O **Artigo 177, inciso IV** estabelece que o funcionário deve cumprir prontamente as ordens dos seus superiores hierárquicos, <strong>EXCETO quando forem manifestamente ilegais</strong>.
    </p>

    <p>
        Se um chefe imediato expedir uma ordem que viole abertamente a lei ou constitua crime, o subordinado <strong>tem o dever legal de se recusar a cumpri-la</strong> e deve formalizar uma representação à autoridade superior. Se o funcionário cumprir uma ordem manifestamente ilegal sabendo da sua ilicitude, ele responderá administrativa e criminalmente junto com o seu chefe.
    </p>

    <h3 class="section-title">O Rito da Representação e o Direito de Petição (Art. 189)</h3>
    <p>
        Quando o servidor deseja denunciar um abuso ou requerer a revisão de uma decisão que afete seus direitos, ele utiliza o direito de petição. Tratando-se de **Representação**, o documento deve ser **endereçado à autoridade superior** (quem tem poder de decisão), mas o seu protocolo físico deve ser feito **por intermédio da chefia imediata**.
    </p>

    <p>
        A lei concede à chefia imediata o prazo máximo de **5 (cinco) dias** para despachar e encaminhar a representação. Caso o chefe retenha o documento por mais de 5 dias sem motivo justificável, o funcionário ganha o direito de protocolar a representação diretamente na autoridade superior.
    </p>

    <!-- CAPÍTULO 7 -->
    <h2 class="chapter-title">7. Apuração de Faltas: Sindicância vs PAD e a Pena de Demissão</h2>

    <p>
        Quando ocorre um deslize ou irregularidade no serviço público municipal, a prefeitura deve apurar os fatos antes de aplicar qualquer punição. Existem dois procedimentos distintos:
    </p>

    <p>
        <strong>A Sindicância (Arts. 196 e ss.):</strong> É uma investigação sumária e preparatória. É instaurada quando a Administração sabe que uma irregularidade aconteceu, mas <em>não sabe quem a praticou</em> (autoria incerta) ou precisa esclarecer a gravidade dos fatos. A sindicância busca reunir provas iniciais.
    </p>

    <p>
        <strong>O PAD (Processo Administrativo Disciplinar):</strong> É instaurado quando já existe uma acusação formal contra um servidor identificado (autoria determinada) por falta punível com sanções graves. No PAD, é assegurado o direito ao contraditório e à ampla defesa com advogado.
    </p>

    <h3 class="section-title">A Competência Exclusiva do Prefeito para Demissão (Art. 200, I)</h3>

    <p>
        As penalidades disciplinares variam conforme a gravidade da falta (advertência, suspensão, demissão e cassação de aposentadoria). As sanções mais graves do estatuto — a <strong>Demissão</strong> (desligamento punitivo do servidor ativo) e a <strong>Cassação de Aposentadoria</strong> — atingem a própria subsistência do vínculo funcional.
    </p>

    <p>
        Por essa razão, o <strong>Artigo 200, inciso I</strong> da LC nº 133/1985 estabelece que a aplicação das penas de demissão e cassação de aposentadoria é de <strong>competência EXCLUSIVA E PRIVATIVA DO PREFEITO MUNICIPAL DE PORTO ALEGRE</strong>. Nem Secretários Municipais nem Diretores de Autarquias (como DMLU ou DMAE) possuem autoridade legal para assinar um ato de demissão.
    </p>

    <!-- CAPÍTULO 8 -->
    <h2 class="chapter-title">8. A Trinca do Atendimento Preferencial no Município</h2>

    <p>
        Para encerrar nossa exposição didática, cabe destacar o **Artigo 196, inciso XVIII**, que é alvo frequente de questões da banca FUNDATEC. A lei estabelece que determinados papéis e solicitações devem ter **atendimento pronto e preferencial** em qualquer repartição municipal de Porto Alegre. São três as hipóteses prioritárias:
    </p>

    <ol class="clean-list">
        <li><strong>Pedidos de Certidões:</strong> Requeridos pelos cidadãos para a defesa de direitos ou esclarecimento de situações de interesse pessoal.</li>
        <li><strong>Requisições de Informações da CÂMARA MUNICIPAL:</strong> Pedidos formais de esclarecimento emitidos pelos vereadores de Porto Alegre no exercício do controle externo.</li>
        <li><strong>Diligências para Defesa da FAZENDA MUNICIPAL e instrução de PAD:</strong> Solicitações urgentes de documentos e provas para instruir processos judiciais em que a prefeitura seja ré ou para instruir processos disciplinares internos.</li>
    </ol>

    <p>
        Esses três expedientes devem furar a fila dos processos ordinários de rotina e receber despacho imediato pelas chefias e servidores.
    </p>

    <!-- CONCLUSÃO -->
    <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #0f172a; text-align: center; font-family: 'Inter', sans-serif; font-size: 9.5pt; color: #475569;">
        <p class="no-indent">
            <strong>Você concluiu a leitura expositiva do Estatuto dos Funcionários Públicos de Porto Alegre (LC nº 133/1985).</strong><br>
            Agora que os conceitos, a lógica legal e os exemplos do dia a dia estão fixados em sua mente, você está 100% preparado para iniciar suas revisões ativas no Anki e gabaritar as questões da banca FUNDATEC!
        </p>
    </div>

</body>
</html>
"""
    return html_content

if __name__ == "__main__":
    html_out = "Estatuto_Porto_Alegre_Explicado.html"
    pdf_out = "Estatuto_Porto_Alegre_Explicado.pdf"
    
    # Write HTML file
    with open(html_out, "w", encoding="utf-8") as f:
        f.write(generate_clean_html())
    print(f"HTML Explicativo Gerado: {html_out}")

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
        print(f"PDF Explicativo Gerado com Sucesso: {pdf_out} ({os.path.getsize(pdf_out)} bytes)")
    else:
        print("Erro na geração do PDF Explicativo.")
