import os
import subprocess
import tempfile

cards_data = [
    {
        "id": 1,
        "question": "Na LC nº 133/1985 de Porto Alegre, a posse em cargo público pode ser realizada mediante procuração?",
        "answer": "Não. Na LC nº 133/1985 de Porto Alegre, a posse é ato personalíssimo e a lei municipal não prevê posse por procuração.",
        "artigo": "Arts. 22 a 26 da LC nº 133/1985",
        "explicacao": "Diferentemente do Estatuto dos Servidores Federais (Lei nº 8.112/1990), a Lei Complementar Municipal nº 133/1985 de Porto Alegre NÃO autoriza a posse por procuração. No âmbito do Município de Porto Alegre, a posse é entendida como um ato solene e personalíssimo, exigindo o comparecimento presencial e físico do nomeado para assinar o termo de posse e assumir o compromisso com o serviço público.",
        "exemplo": "Juliana foi aprovada para Médica no Hospital de Pronto Socorro (HPS) de Porto Alegre. No dia marcado para a posse, ela estava em um congresso na Espanha e enviou uma procuração pública para seu irmão assiná-la. A Secretaria de Administração indeferiu o pedido, pois a legislação municipal exige a presença física do empossado.",
        "dica_prova": "Atenção: A Lei Federal 8.112/90 permite posse por procuração, mas a LC 133/85 de Porto Alegre NÃO PERMITE. Nas provas municipais organizadas pela FUNDATEC, assinale NÃO."
    },
    {
        "id": 2,
        "question": "Na LC nº 133/1985 de Porto Alegre, qual ato formal caracteriza a aceitação expressa das atribuições, deveres e responsabilidades do cargo público?",
        "answer": "A posse.",
        "artigo": "Art. 22 da LC nº 133/1985",
        "explicacao": "O ciclo de ingresso no serviço público municipal possui três momentos distintos: a Nomeação (convocação unilateral), a Posse (investidura e aceitação dos deveres) e o Exercício (efetivo início do trabalho). A posse (Art. 22) é precisamente o ato formal marcado pela assinatura do Termo de Posse, no qual o empossado declara aceitar expressamente os deveres, atribuições e encargos do cargo.",
        "exemplo": "Carlos compareceu à Secretaria Municipal de Administração após ter sido nomeado no Diário Oficial. Ao assinar o 'Termo de Posse', ele declarou expressamente aceitar a jornada de 40 horas e o regime jurídico do município. Foi nesse ato exato da assinatura que ocorreu a sua investidura no cargo público.",
        "dica_prova": "Grave a tríade: Nomeação = Convocação; Posse = Investidura e Aceitação dos Deveres; Exercício = Efetivo trabalho. A resposta para 'aceitação expressa' é a POSSE."
    },
    {
        "id": 3,
        "question": "Na LC nº 133/1985 de Porto Alegre, por qual instrumento normativo os cargos públicos municipais são criados?",
        "answer": "Por lei.",
        "artigo": "Art. 3º da LC nº 133/1985",
        "explicacao": "Pelo Princípio da Reserva de Lei (Art. 3º), a criação, alteração ou extinção de cargos públicos no Município de Porto Alegre exige obrigatoriamente a edição de LEI em sentido formal, aprovada pela Câmara Municipal de Vereadores e sancionada pelo Prefeito. Nenhum cargo público pode ser criado por Decreto Executivo, Portaria ou Ordem de Serviço.",
        "exemplo": "Diante da alta demanda de licitações, a Prefeitura de Porto Alegre precisou criar 20 novos cargos de Analista de Compras. O Prefeito não pode expedir um Decreto para criar esses cargos: ele teve que enviar um Projeto de Lei para votação na Câmara de Vereadores.",
        "dica_prova": "Criação de cargo público exige sempre LEI. Decreto serve apenas para extinguir cargos vagos ou reorganizar a estrutura administrativa sem aumento de despesas."
    },
    {
        "id": 4,
        "question": "Na LC nº 133/1985 de Porto Alegre, como se conceitua o agrupamento de cargos da mesma profissão e de igual nível de complexidade, e qual é a forma de ascensão funcional dentro dele?",
        "answer": "O agrupamento é a classe, e a ascensão funcional ocorre por promoção.",
        "artigo": "Art. 5º da LC nº 133/1985",
        "explicacao": "O Artigo 5º conceitua Classe como o agrupamento de cargos da mesma profissão e de igual nível de complexidade e responsabilidade. A passagem do funcionário de uma classe para a classe imediatamente superior dentro da mesma carreira denomina-se PROMOÇÃO, a qual ocorre alternadamente por antiguidade e merecimento. Já o Quadro (Art. 6º) é o conjunto geral de cargos do município.",
        "exemplo": "Fernanda tomou posse como Auditora Fiscal na Classe A (classe inicial). Após 3 anos de efetivo exercício e excelente avaliação de desempenho, ela foi promovida para a Classe B, recebendo acréscimo no padrão salarial sem mudar a natureza do cargo.",
        "dica_prova": "Não confunda Classe (Art. 5º - agrupamento de cargos da mesma profissão) com Quadro (Art. 6º - conjunto geral de cargos). A ascensão entre classes da mesma carreira é sempre a PROMOÇÃO."
    },
    {
        "id": 5,
        "question": "Na LC nº 133/1985 de Porto Alegre, de que forma o funcionário pode fracionar seu período anual de férias?",
        "answer": "Em até 2 períodos, desde que nenhum deles seja inferior a 10 dias.",
        "artigo": "Art. 81 da LC nº 133/1985",
        "explicacao": "O funcionário municipal faz jus a 30 dias de férias anuais remuneradas a cada 12 meses de efetivo trabalho. O Artigo 81 permite o parcelamento/fracionamento desses 30 dias em no máximo 2 (dois) períodos, desde que nenhum dos períodos seja inferior a 10 (dez) dias corridos.",
        "exemplo": "Lucas, arquiteto da Secretaria de Urbanismo, solicita o fracionamento das suas férias em 2 períodos: 15 dias em janeiro e 15 dias em julho. O pedido é válido. Porém, se ele pedisse 5 dias em janeiro, 10 em maio e 15 em dezembro, seria indeferido por violar o limite de 2 etapas e o mínimo de 10 dias.",
        "dica_prova": "Memorize os dois limites do Art. 81: até 2 períodos e no mínimo 10 dias por período."
    },
    {
        "id": 6,
        "question": "Na LC nº 133/1985 de Porto Alegre, como é calculada a gratificação natalina do funcionário municipal?",
        "answer": "Corresponde a 1/12 da remuneração devida em dezembro por mês de efetivo exercício no ano.",
        "artigo": "Art. 98 da LC nº 133/1985",
        "explicacao": "A Gratificação Natalina (13º salário) é calculada na proporção de 1/12 (um doze avos) por mês de efetivo exercício durante o ano civil. A regra fundamental do Art. 98 é que o cálculo incide sobre a remuneração devida no mês de DEZEMBRO. Qualquer fração de trabalho igual ou superior a 15 dias no mês é computada como mês integral.",
        "exemplo": "Juliana tomou posse em 1º de julho de 2026. Em dezembro de 2026, seu salário é de R$ 8.000,00. Como trabalhou 6 meses completos no ano, sua gratificação natalina será de 6/12 de R$ 8.000,00 = R$ 4.000,00.",
        "dica_prova": "A base de cálculo é a remuneração de DEZEMBRO (e não a média anual). Trabalhou 15 dias ou mais no mês, conta como mês cheio (1/12)."
    },
    {
        "id": 7,
        "question": "Na LC nº 133/1985 de Porto Alegre, qual deve ser a conduta do funcionário perante ordens de seus superiores hierárquicos?",
        "answer": "O funcionário deve cumprir as ordens dos superiores, exceto quando manifestamente ilegais.",
        "artigo": "Art. 177, IV da LC nº 133/1985",
        "explicacao": "O direito administrativo aplica a obediência hierárquica atenuada (Art. 177, IV). O servidor deve cumprir as ordens dos chefes, EXCETO quando forem manifestamente ilegais. Diante de uma ordem abertamente ilegal ou criminosa, o funcionário tem a obrigação legal de se recusar a cumpri-la e representar à autoridade superior.",
        "exemplo": "O diretor de um setor exige que um agente emita um pagamento sem a entrega das mercadorias. Por ser fraude evidente, a ordem é manifestamente ilegal. O agente recusa-se a assinar e protocola uma representação formal.",
        "dica_prova": "Ordens manifestamente ilegais NÃO devem ser cumpridas! A recusa deve ser prévia e imediata."
    },
    {
        "id": 8,
        "question": "Na LC nº 133/1985 de Porto Alegre, quando houver notícia de falta funcional sem dados suficientes para determinar a autoria ou responsabilidade, qual procedimento preliminar deve ser instaurado?",
        "answer": "Sindicância.",
        "artigo": "Arts. 196 e ss. da LC nº 133/1985",
        "explicacao": "A Sindicância é o procedimento investigativo preliminar instaurado pela Administração quando a falta é noticiada, mas a autoria é incerta ou o fato precisa ser esclarecido. Não é uma punição, mas uma apuração sumária para instruir um futuro Processo Administrativo Disciplinar (PAD) caso confirmada a responsabilidade.",
        "exemplo": "Sumiu um equipamento de informática na Secretaria de Educação durante o final de semana. Não se sabe quem pegou nem se foi furto ou descarte indevido. A autoridade instaura uma Sindicância para ouvir testemunhas e apurar os fatos.",
        "dica_prova": "Autoria incerta ou fato duvidoso = Sindicância. Acusação formal contra servidor identificado = PAD."
    },
    {
        "id": 9,
        "question": "Na LC nº 133/1985 de Porto Alegre, o período de afastamento para prestação de serviço militar voluntário é contado como tempo de efetivo exercício?",
        "answer": "Não. O serviço militar voluntário não é considerado efetivo exercício.",
        "artigo": "Art. 76, V da LC nº 133/1985",
        "explicacao": "O Artigo 76, V estabelece que apenas o Serviço Militar OBRIGATÓRIO (recrutamento compulsório) é contado como tempo de efetivo exercício. O afastamento para prestação de serviço militar VOLUNTÁRIO (engajamento facultativo) NÃO é computado como efetivo exercício na prefeitura.",
        "exemplo": "Rodrigo tira licença do cargo municipal para se engajar por 2 anos na Força Aérea como oficial temporário voluntário. Ao retornar, esses 2 anos de serviço voluntário não entram no cômputo de seu tempo de efetivo exercício no município.",
        "dica_prova": "Serviço Militar Obrigatório = Conta como efetivo exercício. Serviço Militar Voluntário = NÃO conta."
    },
    {
        "id": 10,
        "question": "Na LC nº 133/1985 de Porto Alegre, qual é o intervalo considerado trabalho noturno e qual é a duração ficta da hora noturna?",
        "answer": "O horário noturno vai das 22h às 5h, e a hora noturna computa-se como 52 minutos e 30 segundos.",
        "artigo": "Art. 41, parágrafo único da LC nº 133/1985",
        "explicacao": "O trabalho noturno (Art. 41) é aquele executado entre 22h de um dia e 5h do dia seguinte. Cada hora noturna é computada administrativamente como 52 minutos e 30 segundos (duração ficta da hora), garantindo compensação ao desgaste biológico além do adicional noturno.",
        "exemplo": "Um plantonista do Hospital Presidente Vargas trabalha das 22h às 5h (7 horas de relógio). Pela hora ficta (52min30s por hora), o registro de ponto contabilizará exatamente 8 horas de jornada cumprida.",
        "dica_prova": "Guarde a dupla numérica: Horário das 22h às 5h e hora noturna de 52 minutos e 30 segundos."
    },
    {
        "id": 11,
        "question": "Na LC nº 133/1985 de Porto Alegre, qual é a diferença conceitual entre lotação e exercício?",
        "answer": "Lotação indica a repartição de exercício do funcionário; exercício é o efetivo desempenho das atribuições do cargo.",
        "artigo": "Arts. 27 e 30 da LC nº 133/1985",
        "explicacao": "Lotação (Art. 27) é a vinculação administrativa do funcionário a uma determinada secretaria ou unidade (indica ONDE o cargo está alocado). Exercício (Art. 30) é a prática real e diária das atribuições do cargo (é o ato de TRABALHAR).",
        "exemplo": "Patricia toma posse e sua Portaria indica lotação na Secretaria de Meio Ambiente. Quando ela se apresenta à repartição e começa a despachar processos, ela entra em exercício.",
        "dica_prova": "As bancas trocam os conceitos: Lotação = Órgão/Unidade de alocação; Exercício = Efetivo ato de trabalhar."
    },
    {
        "id": 12,
        "question": "Na LC nº 133/1985 de Porto Alegre, a readaptação em cargo de atribuições afins pode acarretar redução da remuneração do servidor?",
        "answer": "Não. A readaptação é realizada sem qualquer diminuição da remuneração.",
        "artigo": "Arts. 57 a 60 da LC nº 133/1985",
        "explicacao": "Readaptação (Arts. 57 a 60) é a investidura em cargo de atribuições compatíveis com a limitação de saúde sofrida pelo servidor. Pelo Princípio da Irredutibilidade Vencimental (Art. 58), a readaptação JAMAIS pode provocar qualquer redução salarial.",
        "exemplo": "Um Guarda Municipal sofre lesão grave em serviço e é readaptado para Agente Administrativo. Mesmo que o salário inicial de agente seja menor, ele manterá 100% da remuneração de guarda.",
        "dica_prova": "Readaptação NUNCA gera redução de remuneração! Alternativa que falar em diminuição salarial por restrição médica está incorreta."
    },
    {
        "id": 13,
        "question": "Na LC nº 133/1985 de Porto Alegre, qual autoridade detém a competência para aplicar as penalidades disciplinarmente gravosas de demissão ou cassação de aposentadoria?",
        "answer": "O Prefeito Municipal.",
        "artigo": "Art. 200, I da LC nº 133/1985",
        "explicacao": "Devido à gravidade extrema das penas de Demissão e Cassação de Aposentadoria, o Artigo 200, I atribui essa competência EXCLUSIVAMENTE ao Prefeito Municipal de Porto Alegre. Secretários e diretores só podem aplicar penas mais leves (advertência e suspensão).",
        "exemplo": "Um auditor respondeu a PAD por falta grave. O Secretário da Fazenda concorda com a demissão, mas não pode assiná-la: ele remete o processo ao Gabinete do Prefeito para expedição do decreto punitivo.",
        "dica_prova": "Penas graves (Demissão e Cassação) = Competência privativa e indelegável do PREFEITO MUNICIPAL."
    },
    {
        "id": 14,
        "question": "Na LC nº 133/1985 de Porto Alegre, a quem deve ser dirigida e por onde deve tramitar a representação referente ao direito de petição?",
        "answer": "Deve ser dirigida à autoridade superior e encaminhada por intermédio da chefia imediata.",
        "artigo": "Art. 189 da LC nº 133/1985",
        "explicacao": "Nos termos do Art. 189, a Representação é dirigida à autoridade superior (quem decide), mas seu protocolo tramita por intermédio da chefia imediata. Se o chefe retiver o documento por mais de 5 dias, o servidor pode remetê-lo diretamente à autoridade superior.",
        "exemplo": "Marcos faz uma representação ao Secretário de Segurança (autoridade superior). Ele a entrega ao seu coordenador (chefia imediata) para que ponha o despacho de encaminhamento.",
        "dica_prova": "Dirigida à Autoridade Superior, encaminhada via Chefia Imediata (prazo máximo de retenção: 5 dias)."
    },
    {
        "id": 15,
        "question": "Na LC nº 133/1985 de Porto Alegre, o servidor estável pode ser autorizado a se afastar do Município para pós-graduação ou aperfeiçoamento no exterior mantendo a remuneração?",
        "answer": "Sim, desde que autorizado pelo Prefeito e o estudo seja de interesse direto do serviço público municipal.",
        "artigo": "Art. 32, II e III da LC nº 133/1985",
        "explicacao": "O afastamento remunerado para aperfeiçoamento no exterior (Art. 32) exige 3 requisitos cumulativos: 1) Servidor estável; 2) Autorização expressa do Prefeito Municipal; 3) Interesse direto do serviço público municipal.",
        "exemplo": "Uma médica infectologista estável da Secretaria de Saúde é autorizada pelo Prefeito a fazer doutorado de 2 anos em Lisboa sobre epidemias. Ao retornar, ela deve permanecer no município por pelo menos 2 anos.",
        "dica_prova": "Requisitos obrigatórios: Servidor Estável + Autorização do Prefeito + Interesse direto do Município."
    },
    {
        "id": 16,
        "question": "Na LC nº 133/1985 de Porto Alegre, qual indenização é concedida ao funcionário que se desloca da sede a serviço para cobrir despesas extraordinárias de alimentação e pousada?",
        "answer": "Diárias.",
        "artigo": "Art. 88 da LC nº 133/1985",
        "explicacao": "A Diária (Art. 88) é a verba indenizatória concedida ao servidor que se desloca temporariamente da sede (Porto Alegre) para cobrir despesas de pousada e alimentação. Não se incorpora ao salário.",
        "exemplo": "Um auditor da Controladoria viaja a Brasília por 3 dias para reuniões técnicas. Ele recebe diárias para pagar o hotel e as refeições durante a viagem.",
        "dica_prova": "Diárias = Pousada e Alimentação em deslocamento transitório fora da sede."
    },
    {
        "id": 17,
        "question": "Na LC nº 133/1985 de Porto Alegre, como se conceitua o processo de seleção pública para provimento de cargos efetivos?",
        "answer": "Concurso público.",
        "artigo": "Art. 11 da LC nº 133/1985",
        "explicacao": "O Concurso Público (Art. 11) é o processo democrático e impessoal de provas ou de provas e títulos obrigatório para o ingresso em cargos efetivos. Validade de até 2 anos, prorrogável uma vez.",
        "exemplo": "A prefeitura realiza concurso público com prova objetiva e prova de títulos para selecionar 50 novos professores de ensino fundamental.",
        "dica_prova": "Cargo efetivo exige obrigatoriamente concurso público. Cargo em comissão é de livre nomeação e exoneração."
    },
    {
        "id": 18,
        "question": "Na LC nº 133/1985 de Porto Alegre, quais pedidos e requisições devem ter atendimento pronto e preferencial por parte dos órgãos municipais?",
        "answer": "Pedidos de certidões, informações da Câmara Municipal e diligências para defesa da Fazenda Municipal ou processos disciplinares.",
        "artigo": "Art. 196, XVIII da LC nº 133/1985",
        "explicacao": "O Artigo 196, XVIII exige atendimento pronto e preferencial para: 1) Certidões para cidadãos; 2) Informações requisitadas pela Câmara Municipal; 3) Diligências para defesa da Fazenda Municipal ou PAD.",
        "exemplo": "Chega no setor um pedido de informação da Câmara de Vereadores. O chefe do setor coloca o expediente no topo da pilha para resposta imediata, antes dos processos comuns.",
        "dica_prova": "Trinca do atendimento preferencial: Certidões, Câmara Municipal e Defesa da Fazenda/PAD."
    }
]

def generate_clean_flashcards_html():
    html_content = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Flashcards Explicados - LC nº 133/1985 Porto Alegre</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap');

        @page {
            size: A4;
            margin: 20mm 18mm 20mm 18mm;
            @top-center {
                content: "Estatuto dos Funcionários Públicos de Porto Alegre (LC nº 133/1985) — Flashcards Explicados";
                font-family: 'Inter', sans-serif;
                font-size: 8.5pt;
                color: #64748b;
                border-bottom: 1px solid #e2e8f0;
                padding-bottom: 4px;
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
            line-height: 1.65;
            font-size: 10.5pt;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        /* --- HEADER BLOCK --- */
        .header-block {
            text-align: center;
            padding: 30px 10px 20px 10px;
            border-bottom: 2px solid #1c1917;
            margin-bottom: 30px;
        }

        .header-subtitle {
            font-family: 'Inter', sans-serif;
            font-size: 9pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #0369a1;
            margin-bottom: 8px;
        }

        .header-title {
            font-size: 24pt;
            font-weight: 700;
            color: #0f172a;
            line-height: 1.25;
            margin-bottom: 10px;
        }

        .header-desc {
            font-family: 'Inter', sans-serif;
            font-size: 10.5pt;
            color: #475569;
            max-width: 90%;
            margin: 0 auto;
        }

        /* --- FLASHCARD MODULE ITEM --- */
        .card-item {
            page-break-inside: avoid;
            border-bottom: 1px solid #d6d3d1;
            padding-bottom: 22px;
            margin-bottom: 24px;
        }

        .card-top {
            font-family: 'Inter', sans-serif;
            font-size: 9pt;
            font-weight: 700;
            color: #0369a1;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 6px;
            display: flex;
            justify-content: space-between;
        }

        .card-question {
            font-family: 'Inter', sans-serif;
            font-size: 12pt;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 8px;
            line-height: 1.4;
        }

        .card-answer {
            background-color: #f0fdf4;
            border-left: 3.5px solid #15803d;
            padding: 10px 14px;
            font-family: 'Inter', sans-serif;
            font-size: 10.5pt;
            font-weight: 600;
            color: #14532d;
            margin-bottom: 12px;
            border-radius: 0 4px 4px 0;
        }

        .card-explanation {
            font-size: 10.5pt;
            color: #292524;
            margin-bottom: 10px;
            text-align: justify;
        }

        .story-block {
            background-color: #fafaf9;
            border-left: 3px solid #0284c7;
            padding: 10px 14px;
            margin: 10px 0;
            font-size: 10pt;
            color: #1c1917;
            border-radius: 0 4px 4px 0;
        }

        .story-block .title {
            font-family: 'Inter', sans-serif;
            font-size: 8.5pt;
            font-weight: 700;
            text-transform: uppercase;
            color: #0369a1;
            margin-bottom: 4px;
        }

        .tip-block {
            background-color: #fefce8;
            border-left: 3px solid #ca8a04;
            padding: 10px 14px;
            margin: 10px 0;
            font-size: 9.8pt;
            color: #713f12;
            border-radius: 0 4px 4px 0;
        }

        .tip-block .title {
            font-family: 'Inter', sans-serif;
            font-size: 8.5pt;
            font-weight: 700;
            text-transform: uppercase;
            color: #a16207;
            margin-bottom: 4px;
        }
    </style>
</head>
<body>

    <div class="header-block">
        <div class="header-subtitle">Material de Apoio ao Anki — Porto Alegre</div>
        <h1 class="header-title">Flashcards Explicados e Contextualizados</h1>
        <p class="header-desc">Lei Complementar nº 133/1985 (Estatuto dos Funcionários Públicos). Consulte a explicação humana e o exemplo prático sempre que tiver dúvidas durante as revisões no Anki.</p>
    </div>

    <div class="cards-list">
"""

    for card in cards_data:
        html_content += f"""
        <!-- CARD {card['id']} -->
        <div class="card-item">
            <div class="card-top">
                <span>CARD #{card['id']:02d}</span>
                <span>{card['artigo']}</span>
            </div>

            <div class="card-question">"{card['question']}"</div>

            <div class="card-answer">✅ Resposta Objetiva: {card['answer']}</div>

            <div class="card-explanation">
                <strong>Explicação Legal:</strong> {card['explicacao']}
            </div>

            <div class="story-block">
                <div class="title">💡 Exemplo Prático do Dia a Dia</div>
                <div>{card['exemplo']}</div>
            </div>

            <div class="tip-block">
                <div class="title">🎯 Atenção para Provas (FUNDATEC)</div>
                <div>{card['dica_prova']}</div>
            </div>
        </div>
        """

    html_content += """
    </div>

</body>
</html>
"""
    return html_content

if __name__ == "__main__":
    html_out = "Flashcards_LC133_Porto_Alegre_Explicados.html"
    pdf_out = "Flashcards_LC133_Porto_Alegre_Explicados.pdf"
    
    # Write HTML file
    with open(html_out, "w", encoding="utf-8") as f:
        f.write(generate_clean_flashcards_html())
    print(f"HTML limpo dos Flashcards gerado: {html_out}")

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
        print(f"PDF limpo dos Flashcards gerado com Sucesso: {pdf_out} ({os.path.getsize(pdf_out)} bytes)")
    else:
        print("Erro na geração do PDF limpo dos Flashcards.")
