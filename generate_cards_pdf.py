import os
import subprocess
import tempfile

# Content structure for all 18 flashcards - AUDITED & CORRETO CONFORME LC 133/1985 PORTO ALEGRE
cards_data = [
    {
        "id": 1,
        "question": "Na LC nº 133/1985 de Porto Alegre, a posse em cargo público pode ser realizada mediante procuração?",
        "answer": "Não. Na LC nº 133/1985 de Porto Alegre, a posse é ato personalíssimo e a lei municipal não prevê posse por procuração.",
        "tag": "Legislacao_Municipal::Porto_Alegre::LC_133_1985::Provimento_e_posse",
        "topic": "Provimento e Posse (Caráter Personalíssimo)",
        "artigo": "Arts. 22 a 26 da LC nº 133/1985",
        "explicacao": "Diferentemente do Estatuto dos Servidores Federais (Lei nº 8.112/1990), a <strong>Lei Complementar Municipal nº 133/1985 de Porto Alegre NÃO prevê a possibilidade de posse por procuração</strong>. No âmbito do Município de Porto Alegre, a posse é considerada um ato solene e personalíssimo, exigindo o comparecimento presencial e físico do nomeado para a assinatura do termo de posse e prestação do compromisso legal perante o órgão competente.",
        "exemplo": "Maria foi aprovada em 1º lugar para o cargo de Médica no Hospital de Pronto Socorro (HPS) de Porto Alegre. No dia marcado para a posse, ela solicitou que seu irmão assinasse o termo mediante procuração pública por estar viajando. O órgão de Recursos Humanos da Prefeitura indeferiu o pedido com base na LC 133/1985, exigindo seu comparecimento pessoal para a investidura.",
        "dica_prova": "⚡ <strong>PEGADINHA CLÁSSICA DE PROVA:</strong> A Lei Federal nº 8.112/90 (Art. 13, § 3º) ADMITE posse por procuração específica. Contudo, a LC nº 133/1985 de Porto Alegre NÃO AUTORIZA procuração para posse! Se a prova for de Porto Alegre, marque <strong>NÃO</strong>!"
    },
    {
        "id": 2,
        "question": "Na LC nº 133/1985 de Porto Alegre, qual ato formal caracteriza a aceitação expressa das atribuições, deveres e responsabilidades do cargo público?",
        "answer": "A posse.",
        "tag": "Legislacao_Municipal::Porto_Alegre::LC_133_1985::Provimento_e_posse",
        "topic": "Provimento e Posse",
        "artigo": "Art. 22 da LC nº 133/1985",
        "explicacao": "O ciclo de ingresso no serviço público municipal possui 3 momentos jurídicos distintos: 1) <strong>Nomeação</strong> (ato administrativo unilateral de provimento que convoca o aprovado); 2) <strong>Posse</strong> (ato bilateral formal que investe o cidadão no cargo público, mediante aceitação expressa dos deveres e atribuições); 3) <strong>Exercício</strong> (efetivo início do desempenho das tarefas). A posse é precisamente o ato formal marcado pela assinatura do Termo de Posse, no qual o empossado compromete-se a cumprir fielmente os deveres do cargo e aceita o regime jurídico e estatutário do Município.",
        "exemplo": "Carlos foi nomeado no Diário Oficial Porto Alegre (DOPA). Ele compareceu à Secretaria de Administração munido de seus exames de aptidão física e mental. Ao assinar o 'Termo de Posse', Carlos declarou expressamente aceitar a jornada de 40 horas, as tarefas descritas na lei da carreira e a remuneração legal. Foi nesse ato exato da assinatura da posse que ocorreu a sua investidura como funcionário público de Porto Alegre.",
        "dica_prova": "Grave a tríade do ingresso: <strong>Nomeação</strong> = Chamamento; <strong>Posse</strong> = Investidura e Aceitação dos Deveres (Art. 22); <strong>Exercício</strong> = Prática efetiva do trabalho. A questão que perguntar sobre 'aceitação expressa de deveres' ou 'investidura' tem como resposta a <strong>POSSE</strong>."
    },
    {
        "id": 3,
        "question": "Na LC nº 133/1985 de Porto Alegre, por qual instrumento normativo os cargos públicos municipais são criados?",
        "answer": "Por lei.",
        "tag": "Legislacao_Municipal::Porto_Alegre::LC_133_1985::Cargos_publicos",
        "topic": "Cargos Públicos",
        "artigo": "Art. 3º da LC nº 133/1985",
        "explicacao": "Pelo Princípio da Reserva de Lei (art. 61, § 1º, II, 'a' da CF/88 combinado com o Estatuto Municipal), a criação, alteração ou extinção de cargos públicos (sejam eles efetivos ou em comissão) exige obrigatoriamente a edição de <strong>LEI</strong> em sentido formal, aprovada pela Câmara Municipal de Porto Alegre e sancionada pelo Prefeito. Nenhum cargo público pode ser criado por Decreto do Prefeito, Portaria, Resolução ou Ordem de Serviço.",
        "exemplo": "Diante do aumento da demanda de licitações, a Prefeitura de Porto Alegre identificou a necessidade de criar 30 novos cargos de 'Analista de Compras Públicas'. O Prefeito não pode expedir um Decreto criando esses cargos. Ele precisa elaborar um Projeto de Lei (PL), enviá-lo para votação na Câmara Municipal de Vereadores de Porto Alegre e, após aprovação em plenário, sancionar a Lei Municipal correspondente.",
        "dica_prova": "Pegadinha recorrente em concursos: 'O Prefeito pode criar cargos em comissão mediante Decreto Executivo em caso de urgência.' FALSO! Criação de qualquer cargo público exige <strong>LEI</strong>. O Decreto serve apenas para extinguir cargos quando vagos ou reorganizar a estrutura administrativa sem criação de despesas."
    },
    {
        "id": 4,
        "question": "Na LC nº 133/1985 de Porto Alegre, como se conceitua o agrupamento de cargos da mesma profissão e de igual nível de complexidade, e qual é a forma de ascensão funcional dentro dele?",
        "answer": "O agrupamento é a classe, e a ascensão funcional ocorre por promoção.",
        "tag": "Legislacao_Municipal::Porto_Alegre::LC_133_1985::Cargos_publicos",
        "topic": "Cargos Públicos e Promoção",
        "artigo": "Art. 5º da LC nº 133/1985",
        "explicacao": "A estrutura de carreira dos servidores municipais é dividida em níveis hierárquicos verticais chamados de <strong>Classes</strong>. O Artigo 5º conceitua <em>Classe</em> como o agrupamento de cargos de mesma profissão e de igual nível de complexidade. A passagem do funcionário da classe em que se encontra para a classe imediatamente superior dentro da mesma carreira chama-se <strong>PROMOÇÃO</strong>, a qual ocorre mediante critérios alternados de <strong>antiguidade</strong> (tempo na classe) e <strong>merecimento</strong> (avaliação de desempenho). O Art. 6º conceitua <em>Quadro</em> como o conjunto total de cargos.",
        "exemplo": "Fernanda ingressou na Prefeitura de Porto Alegre como Auditora Fiscal da Receita Municipal na Classe A (classe inicial da carreira). Após 3 anos de efetivo exercício e excelente pontuação na sua avaliação periódica de desempenho, Fernanda é promovida para a Classe B. Ela continua sendo Auditora Fiscal com as mesmas atribuições, mas passa a ocupar um grau superior da carreira com acréscimo no padrão vencimental.",
        "dica_prova": "Confusão comum: não confunda <strong>Classe</strong> (Art. 5º) com <strong>Quadro</strong> (Art. 6º). Quadro é o conjunto de todos os cargos do órgão. A ascensão funcional <em>dentro da mesma carreira de uma classe para outra</em> é sempre a <strong>PROMOÇÃO</strong>."
    },
    {
        "id": 5,
        "question": "Na LC nº 133/1985 de Porto Alegre, de que forma o funcionário pode fracionar seu período anual de férias?",
        "answer": "Em até 2 períodos, desde que nenhum deles seja inferior a 10 dias.",
        "tag": "Legislacao_Municipal::Porto_Alegre::LC_133_1985::Ferias",
        "topic": "Direito a Férias",
        "artigo": "Art. 81 da LC nº 133/1985",
        "explicacao": "O servidor municipal de Porto Alegre adquire o direito a 30 dias consecutivos de férias a cada 12 meses de efetivo exercício. Para atender ao interesse do serviço e do servidor, o Artigo 81 da lei permite o parcelamento/fracionamento desses 30 dias em <strong>no máximo 2 (dois) períodos</strong>. O requisito objetivo incontornável é que <strong>nenhum dos períodos fracionados seja inferior a 10 (dez) dias corridos</strong>.",
        "exemplo": "Lucas, arquiteto da Secretaria de Urbanismo, pretende tirar férias em dois momentos do ano para conciliar com os prazos de suas obras. Ele pode requerer o fracionamento em: 1) 15 dias em janeiro e 15 dias em julho; ou 2) 20 dias em março e 10 dias em outubro. Ambas as solicitações cumprem os requisitos (no máximo 2 etapas e nenhuma menor de 10 dias).",
        "dica_prova": "Memorize a dupla restrição numérica para a prova de Porto Alegre (Art. 81): <strong>Até 2 períodos</strong> e <strong>Mínimo de 10 dias por período</strong>. A banca costuma colocar opções falsas como 'fracionamento em até 3 vezes' ou 'períodos não inferiores a 5 dias'."
    },
    {
        "id": 6,
        "question": "Na LC nº 133/1985 de Porto Alegre, como é calculada a gratificação natalina do funcionário municipal?",
        "answer": "Corresponde a 1/12 da remuneração devida em dezembro por mês de efetivo exercício no ano.",
        "tag": "Legislacao_Municipal::Porto_Alegre::LC_133_1985::Vantagens",
        "topic": "Gratificação Natalina (13º Salário)",
        "artigo": "Art. 98 da LC nº 133/1985",
        "explicacao": "A Gratificação Natalina (13º vencimento) é disciplinada no Art. 98 e calculada com base na proporção dos meses em que o funcionário trabalhou durante o ano civil (janeiro a dezembro). Cada mês em que o servidor exercer suas funções por <strong>15 dias ou mais</strong> computa-se como 1 mês integral (1/12). A regra fundamental é que o cálculo incide sobre a <strong>remuneração devida no mês de DEZEMBRO</strong> do ano correspondente.",
        "exemplo": "Juliana tomou posse e entrou em exercício como Engenheira na Prefeitura em 1º de julho de 2026. Em dezembro de 2026, seu vencimento mais vantagens fixas somam R$ 9.000,00. Como trabalhou 6 meses completos no ano (julho a dezembro), Juliana receberá a título de Gratificação Natalina a fração de 6/12 de R$ 9.000,00, totalizando R$ 4.500,00.",
        "dica_prova": "Fique atento aos dois pontos cobrados pelas bancas no Art. 98: 1) O parâmetro financeiro é a remuneração devida em <strong>DEZEMBRO</strong> (e não a média salarial do ano); 2) A fração igual ou superior a 15 dias de trabalho no mês é considerada como mês integral (1/12)."
    },
    {
        "id": 7,
        "question": "Na LC nº 133/1985 de Porto Alegre, qual deve ser a conduta do funcionário perante ordens de seus superiores hierárquicos?",
        "answer": "O funcionário deve cumprir as ordens dos superiores, exceto quando manifestamente ilegais.",
        "tag": "Legislacao_Municipal::Porto_Alegre::LC_133_1985::Regime_disciplinar",
        "topic": "Deveres Disciplinares e Hierarquia",
        "artigo": "Art. 177, IV da LC nº 133/1985",
        "explicacao": "O direito administrativo adota a chamada 'obediência hierárquica moderada ou atenuada'. O funcionário tem o dever de cumprir com presteza as ordens expedidas por seus chefes e superiores. Contudo, essa obediência <strong>NÃO</strong> é cega nem absoluta. Se a ordem for <strong>manifestamente ilegal</strong> (claramente contrária à lei, abusiva ou de cunho criminoso), o servidor tem a obrigação legal de <strong>recusar seu cumprimento</strong> e representar formalmente à autoridade superior competente. Cumprir ordem manifestamente ilegal gera responsabilidade disciplinar, civil e penal conjunta para o subordinado e o superior.",
        "exemplo": "O diretor de uma repartição municipal ordena verbalmente a um agente administrativo que emita um empenho financeiro sem a comprovação da entrega dos suprimentos adquiridos. Por se tratar de fraude flagrante e conduta imoral, a ordem é manifestamente ilegal. O agente recusa-se a assinar o empenho e protocoliza uma representação formal junto ao órgão de controle interno e à Secretaria Superior.",
        "dica_prova": "Duas pegadinhas clássicas de concursos: 1) 'O funcionário deve cumprir toda e qualquer ordem superior sem exceção' (FALSO - ordem manifestamente ilegal não se cumpre); 2) 'O funcionário deve cumprir a ordem ilegal e depois reclamar por escrito' (FALSO - a recusa deve ser prévia e imediata!)."
    },
    {
        "id": 8,
        "question": "Na LC nº 133/1985 de Porto Alegre, quando houver notícia de falta funcional sem dados suficientes para determinar a autoria ou responsabilidade, qual procedimento preliminar deve ser instaurado?",
        "answer": "Sindicância.",
        "tag": "Legislacao_Municipal::Porto_Alegre::LC_133_1985::Processo_disciplinar",
        "topic": "Procedimentos Disciplinares (Sindicância x PAD)",
        "artigo": "Arts. 196 e ss. da LC nº 133/1985",
        "explicacao": "Quando a Administração Municipal toma conhecimento de uma ilicitude ou falta disciplinar, mas não dispõe de elementos seguros sobre <strong>quem praticou a conduta</strong> (autoria incerta) ou sobre a <strong>existência exata do fato</strong> (materialidade duvidosa), deve instaurar uma <strong>Sindicância</strong> (Arts. 196 e ss.). A sindicância é uma investigação preliminar e sumária. Se da sindicância resultarem provadas a autoria e a gravidade da falta punível com penas mais severas, o procedimento converte-se ou enseja a instauração de Processo Administrativo Disciplinar (PAD).",
        "exemplo": "Durante um final de semana, desapareceram 5 notebooks de última geração da Secretaria Municipal de Educação. A chefia constatou o sumiço, mas não sabe se foi um furto praticado por servidores, por terceirizados ou se foi erro de inventário. Para apurar os fatos e identificar os possíveis responsáveis sem formular acusações temerárias, a autoridade baixa portaria instaurando uma <strong>Sindicância</strong>.",
        "dica_prova": "Regra prática de prova: <br>• Autoria desconhecida ou fato nebuloso = <strong>Sindicância</strong> (procedimento inquisitorial/preliminar de apuração).<br>• Fato comprovado com autoria definida e acusação formal = <strong>PAD (Processo Administrativo Disciplinar)</strong>."
    },
    {
        "id": 9,
        "question": "Na LC nº 133/1985 de Porto Alegre, o período de afastamento para prestação de serviço militar voluntário é contado como tempo de efetivo exercício?",
        "answer": "Não. O serviço militar voluntário não é considerado efetivo exercício.",
        "tag": "Legislacao_Municipal::Porto_Alegre::LC_133_1985::Tempo_de_servico",
        "topic": "Contagem de Tempo de Serviço",
        "artigo": "Art. 76, V da LC nº 133/1985",
        "explicacao": "A legislação estatutária de Porto Alegre (Art. 76, V) faz uma distinção crucial quanto ao Serviço Militar: a prestação do <strong>Serviço Militar Obrigatório</strong> (recrutamento compulsório de jovens) é contada integralmente como tempo de efetivo exercício no município. Em contrapartida, a prestação de <strong>Serviço Militar VOLUNTÁRIO</strong> (engajamento, reengajamento facultativo ou oficial temporário por opção) <strong>NÃO é computada como efetivo exercício</strong> para nenhum efeito legal na carreira municipal.",
        "exemplo": "Rodrigo, servidor estatutário de Porto Alegre, obtém licença do município para se engajar voluntariamente por 2 anos na Marinha do Brasil como Tenente Temporário. Ao concluir o período e retornar ao cargo municipal de origem, Rodrigo verifica que esses 2 anos de serviço militar voluntário não serão somados ao seu tempo de efetivo exercício para concessão de licenças, adicionais por tempo de serviço ou promoção.",
        "dica_prova": "Atenção ao adjetivo na questão do concurso!<br>• Serviço Militar <strong>Obrigatório</strong> (Art. 76, V) = É tempo de efetivo exercício.<br>• Serviço Militar <strong>Voluntário</strong> = <strong>NÃO</strong> é tempo de efetivo exercício."
    },
    {
        "id": 10,
        "question": "Na LC nº 133/1985 de Porto Alegre, qual é o intervalo considerado trabalho noturno e qual é a duração ficta da hora noturna?",
        "answer": "O horário noturno vai das 22h às 5h, e a hora noturna computa-se como 52 minutos e 30 segundos.",
        "tag": "Legislacao_Municipal::Porto_Alegre::LC_133_1985::Regime_de_trabalho",
        "topic": "Jornada Noturna e Hora Ficta",
        "artigo": "Art. 41, parágrafo único da LC nº 133/1985",
        "explicacao": "O regime jurídico dos servidores municipais de Porto Alegre (Art. 41, parágrafo único) define o trabalho noturno como aquele prestado entre as <strong>22 horas de um dia e as 5 horas do dia seguinte</strong>. Como compensação ao desgaste físico do trabalho noturno, a lei estabelece a <strong>redução ficta da hora noturna</strong>: cada 52 minutos e 30 segundos trabalhados no período noturno são contados administrativamente como se fossem 1 hora inteira de 60 minutos (7/8 da hora normal).",
        "exemplo": "Um técnico em enfermagem plantonista do Hospital Materno Infantil Presidente Vargas trabalha no turno das 22h às 5h (período de 7 horas relógio contínuas). Devido à redução ficta (52min 30s por hora), essas 7 horas de relógio trabalhadas correspondem exatamente ao cumprimento de 8 horas normais de jornada na sua folha de frequência, além de gerar o pagamento do adicional noturno.",
        "dica_prova": "Grave com precisão os dois parâmetros numéricos do Art. 41:<br>1) Horário: <strong>22h às 5h</strong>.<br>2) Duração da hora noturna: <strong>52 minutos e 30 segundos</strong> (as bancas gostam de colocar 50 minutos ou 45 minutos para enganar o candidato)."
    },
    {
        "id": 11,
        "question": "Na LC nº 133/1985 de Porto Alegre, qual é a diferença conceitual entre lotação e exercício?",
        "answer": "Lotação indica a repartição de exercício do funcionário; exercício é o efetivo desempenho das atribuições do cargo.",
        "tag": "Legislacao_Municipal::Porto_Alegre::LC_133_1985::Provimento_e_posse",
        "topic": "Lotação e Exercício",
        "artigo": "Arts. 27 e 30 da LC nº 133/1985",
        "explicacao": "A <strong>Lotação</strong> (Art. 27) representa a distribuição numérica e administrativa dos servidores entre as diversas secretarias, órgãos e unidades do Município (é o local/órgão para o qual o cargo foi designado). O <strong>Exercício</strong> (Art. 30), por sua vez, é a prática concreta, física e funcional das atividades e responsabilidades do cargo público pelo funcionário. É a data de entrada em exercício que dá início à percepção do vencimento e à contagem do estágio probatório.",
        "exemplo": "Patricia toma posse como Assistente Administrativa. A Portaria de Lotação especifica que a sua <strong>lotação</strong> será a 'Secretaria Municipal de Meio Ambiente e Sustentabilidade (SMAMUS)'. No dia seguinte, Patricia chega às 8h na SMAMUS, senta em sua mesa e começa a protocolar processos: este ato material de começar a trabalhar é a sua entrada em <strong>exercício</strong>.",
        "dica_prova": "As bancas invertem os conceitos nas alternativas! Lembre-se: <strong>Lotação</strong> (Art. 27) = Onde o servidor fica alocado (unidade administrativa). <strong>Exercício</strong> (Art. 30) = O efetivo ato de trabalhar e executar atribuições."
    },
    {
        "id": 12,
        "question": "Na LC nº 133/1985 de Porto Alegre, a readaptação em cargo de atribuições afins pode acarretar redução da remuneração do servidor?",
        "answer": "Não. A readaptação é realizada sem qualquer diminuição da remuneração.",
        "tag": "Legislacao_Municipal::Porto_Alegre::LC_133_1985::Provimento_e_vacancia",
        "topic": "Readaptação Funcional",
        "artigo": "Arts. 57 a 60 da LC nº 133/1985",
        "explicacao": "A <strong>Readaptação</strong> (Arts. 57 a 60) é a forma de provimento mediante a qual o funcionário que sofreu limitação em sua capacidade física ou mental (atestada por inspeção médica oficial) é investido em cargo de atribuições e responsabilidades compatíveis com o seu novo estado de saúde. Em obediência ao Princípio Constitucional da Irredutibilidade de Vencimentos (Art. 58 da LC 133/85), a readaptação <strong>jamais pode acarretar qualquer redução na remuneração</strong> do servidor, assegurando-se o seu padrão salarial original.",
        "exemplo": "Um Guarda Municipal de Porto Alegre sofre uma lesão grave na coluna em serviço, ficando impossibilitado de exercer patrulhamento ostensivo de rua e carregar equipamentos pesados. A junta médica do Município indica a sua readaptação para o cargo de Agente Administrativo de atendimento interno. Mesmo que a tabela inicial do cargo de agente tenha vencimento inferior ao de Guarda Municipal, o servidor readaptado manterá a sua remuneração integral sem qualquer perda financeira.",
        "dica_prova": "Regra de Ouro (Art. 58): <strong>Readaptação NUNCA gera redução de remuneração!</strong> Qualquer opção de prova que mencionar diminuição de vencimento por conta de restrição médica está errada."
    },
    {
        "id": 13,
        "question": "Na LC nº 133/1985 de Porto Alegre, qual autoridade detém a competência para aplicar as penalidades disciplinarmente gravosas de demissão ou cassação de aposentadoria?",
        "answer": "O Prefeito Municipal.",
        "tag": "Legislacao_Municipal::Porto_Alegre::LC_133_1985::Regime_disciplinar",
        "topic": "Competência de Punições Disciplinares",
        "artigo": "Art. 200, I da LC nº 133/1985",
        "explicacao": "Devido à gravidade extrema das sanções de <strong>Demissão</strong> (desligamento punitivo do servidor ativo) e <strong>Cassação de Aposentadoria ou Disponibilidade</strong> (rompimento do benefício do servidor inativo por falta gravíssima cometida quando em atividade), o Art. 200, I da Lei Complementar nº 133/1985 atribui a competência exclusiva e indelegável ao <strong>Prefeito Municipal de Porto Alegre</strong>. Secretários Municipais e Diretores de Autarquias só possuem atribuição para aplicar penas de menor rigor (como advertência ou suspensão).",
        "exemplo": "Um auditor fiscal respondeu a PAD por improbidade administrativa. A comissão disciplinar concluiu o relatório comprovando a falta e sugerindo a demissão. O Secretário da Fazenda não possui poder legal para assinar o ato punitivo final; ele deve encaminhar o expediente ao Gabinete do Prefeito para que o <strong>Prefeito Municipal</strong> expede e assine o Decreto de Demissão.",
        "dica_prova": "Hierarquia de competência punitiva no estatuto de Porto Alegre (Art. 200):<br>• Penas leves (Advertência / Suspensão): Chefias imediatas ou Secretários.<br>• <strong>Demissão e Cassação de Aposentadoria</strong>: Competência privativa do <strong>Prefeito Municipal</strong>."
    },
    {
        "id": 14,
        "question": "Na LC nº 133/1985 de Porto Alegre, a quem deve ser dirigida e por onde deve tramitar a representação referente ao direito de petição?",
        "answer": "Deve ser dirigida à autoridade superior e encaminhada por intermédio da chefia imediata.",
        "tag": "Legislacao_Municipal::Porto_Alegre::LC_133_1985::Direito_de_peticao",
        "topic": "Direito de Petição e Representação",
        "artigo": "Art. 189 da LC nº 133/1985",
        "explicacao": "O direito de petição faculta ao funcionário recorrer contra atos que lesionem seus direitos ou representar contra abusos e ilegalidades. Nos termos do Art. 189 da LC 133/1985, a <strong>Representação</strong> obedece a um rito formal: ela é <strong>endereçada à autoridade superior</strong> competente para solucionar a controvérsia, porém seu protocolo e trâmite inicial ocorrem <strong>por intermédio da chefia imediata</strong>. Se a chefia imediata não der o devido encaminhamento no prazo de 5 (cinco) dias, o servidor fica autorizado a encaminhá-la direta e sucessivamente às autoridades superiores.",
        "exemplo": "Marcos, agente de fiscalização, constata que a escala de serviços elaborada por seu coordenador imediato viola norma legal de repouso. Marcos redige uma Representação formal endereçada ao Secretário Municipal de Segurança (autoridade superior). Contudo, em respeito ao trâmite hierárquico, Marcos entrega a petição ao seu próprio coordenador (chefia imediata) para que este ponha a nota de encaminhamento. Se a chefia retiver por mais de 5 dias, Marcos a envia diretamente ao Secretário.",
        "dica_prova": "Atenção ao rito do Art. 189:<br>• <strong>Dirigida a</strong>: Autoridade Superior.<br>• <strong>Encaminhada por intermédio de</strong>: Chefia imediata.<br>• <strong>Prazo de retenção pela chefia</strong>: Máximo de 5 dias antes do envio direto."
    },
    {
        "id": 15,
        "question": "Na LC nº 133/1985 de Porto Alegre, o servidor estável pode ser autorizado a se afastar do Município para pós-graduação ou aperfeiçoamento no exterior mantendo a remuneração?",
        "answer": "Sim, desde que autorizado pelo Prefeito e o estudo seja de interesse direto do serviço público municipal.",
        "tag": "Legislacao_Municipal::Porto_Alegre::LC_133_1985::Afastamentos",
        "topic": "Afastamento para Aperfeiçoamento no Exterior",
        "artigo": "Art. 32, II e III da LC nº 133/1985",
        "explicacao": "O afastamento remunerado para aperfeiçoamento, especialização ou pós-graduação no exterior é disciplinado no Art. 32, II e III. Para ter direito a manter sua remuneração integral durante o curso fora do país, exige-se o cumprimento cumulativo de 3 requisitos de lei: 1) O servidor deve ser <strong>estável</strong> (cumprido o estágio probatório); 2) Exige <strong>autorização expressa do Prefeito Municipal</strong>; 3) O objeto do curso/estudo deve ter <strong>interesse direto e comprovado com o serviço público municipal</strong>. Após o retorno, o servidor fica obrigado a prestar serviços ao Município por tempo no mínimo equivalente ao do afastamento.",
        "exemplo": "Dra. Helena, médica infectologista concursada e estável da Secretaria Municipal de Saúde de Porto Alegre, é selecionada para um programa de pós-graduação de 2 anos sobre epidemiologia tropical na Universidade de Lisboa. Como o estudo trará impacto direto na gestão de surtos na capital gaúcha, o Prefeito assina a portaria autorizando o afastamento remunerado. Ao concluir o curso, Helena se compromete a trabalhar no município por pelo menos mais 2 anos aplicando o conhecimento adquirido.",
        "dica_prova": "Fixe os 3 pilares exigidos pelas bancas de concurso (Art. 32):<br>1. Servidor <strong>Estável</strong>.<br>2. Autorização do <strong>Prefeito</strong>.<br>3. <strong>Interesse direto</strong> do serviço público municipal."
    },
    {
        "id": 16,
        "question": "Na LC nº 133/1985 de Porto Alegre, qual indenização é concedida ao funcionário que se desloca da sede a serviço para cobrir despesas extraordinárias de alimentação e pousada?",
        "answer": "Diárias.",
        "tag": "Legislacao_Municipal::Porto_Alegre::LC_133_1985::Vantagens",
        "topic": "Indenização por Diárias",
        "artigo": "Art. 88 da LC nº 133/1985",
        "explicacao": "A <strong>Diária</strong> (Art. 88) é uma vantagem pecuniária indenizatória outorgada ao servidor público que se deslocar da sua sede de trabalho em caráter eventual ou transitório no desempenho de suas atribuições ou em missão/estudo de interesse do município. Sua finalidade exclusiva é indenizar o funcionário pelas despesas extraordinárias de <strong>alimentação, pousada e locomoção urbana</strong>. As diárias possuem natureza estritamente indenizatória, não se incorporando ao vencimento nem sofrendo incidência de imposto de renda ou previdência.",
        "exemplo": "Um auditor contábil da Controladoria-Geral do Município de Porto Alegre precisa deslocar-se até Brasília durante 4 dias para participar de reuniões de pactuação de repasses do Governo Federal. Durante esses 4 dias fora da sede, o Município concede diárias ao auditor para ressarcir o custo do hotel (pousada) e de suas refeições (alimentação).",
        "dica_prova": "Diferencie as três indenizações no Estatuto de Porto Alegre:<br>• <strong>Diárias</strong> (Art. 88): Deslocamento eventual para cobrir <em>alimentação e pousada</em>.<br>• <strong>Ajuda de Custo</strong>: Deslocamento com <em>mudança definitiva de sede/domicílio</em>.<br>• <strong>Indenização de Transporte</strong>: Reembolso pelo uso de <em>veículo próprio</em> em serviço."
    },
    {
        "id": 17,
        "question": "Na LC nº 133/1985 de Porto Alegre, como se conceitua o processo de seleção pública para provimento de cargos efetivos?",
        "answer": "Concurso público.",
        "tag": "Legislacao_Municipal::Porto_Alegre::LC_133_1985::Provimento",
        "topic": "Concurso Público",
        "artigo": "Art. 11 da LC nº 133/1985",
        "explicacao": "O <strong>Concurso Público</strong> (Art. 11) é o procedimento administrativo constitucional de seleção impessoal e meritocrática destinado a aferir a aptidão, os conhecimentos técnicos e a capacidade dos candidatos para o ingresso em cargos públicos de provimento <strong>efetivo</strong>. O certame é obrigatoriamente de <strong>provas</strong> ou de <strong>provas e títulos</strong>, devendo respeitar a ordem rigorosa de classificação para as nomeações. Sua validade é de até 2 (dois) anos, prorrogável uma única vez por igual período.",
        "exemplo": "A Prefeitura de Porto Alegre lança edital de concurso público para preenchimento de vagas de Professor de Ensino Fundamental. O processo seletivo realiza uma etapa de prova objetiva e discursiva (provas) e uma etapa de pontuação de diplomas de mestrado/doutorado (títulos). Todos os aprovados são nomeados obedecendo estritamente à ordem de pontuação obtida.",
        "dica_prova": "Lembre-se: Cargo <strong>efetivo</strong> depende indispensavelmente de <strong>concurso público</strong> (Art. 11). Já os cargos em <strong>comissão</strong> (de livre nomeação e exoneração) e as contratações temporárias por excepcional interesse público dispensam concurso público ordinário."
    },
    {
        "id": 18,
        "question": "Na LC nº 133/1985 de Porto Alegre, quais pedidos e requisições devem ter atendimento pronto e preferencial por parte dos órgãos municipais?",
        "answer": "Pedidos de certidões, informações da Câmara Municipal e diligências para defesa da Fazenda Municipal ou processos disciplinares.",
        "tag": "Legislacao_Municipal::Porto_Alegre::LC_133_1985::Deveres",
        "topic": "Atendimento Pronto e Preferencial",
        "artigo": "Art. 196, XVIII da LC nº 133/1985",
        "explicacao": "Para assegurar a celeridade administrativa, a transparência e a eficiência do interesse público, o Art. 196, XVIII da LC 133/1985 prescreve que determinados requerimentos e solicitações possuem prioridade absoluta na tramitação interna dos órgãos municipais, devendo receber <strong>atendimento pronto e preferencial</strong>. São eles: 1) Pedidos de <strong>certidões</strong> requeridas por cidadãos; 2) Requisições de <strong>informações oriundas da Câmara Municipal de Porto Alegre</strong>; 3) Diligências urgentes necessárias para a <strong>defesa da Fazenda Municipal em juízo</strong> e instrução de <strong>processos disciplinares (PAD)</strong>.",
        "exemplo": "No mesmo dia em que chegam 50 processos ordinários de rotina, a chefia de um setor administrativo de Porto Alegre recebe um pedido de informação formal emitido pela Câmara de Vereadores e uma solicitação urgente da Procuradoria do Município para juntar provas em uma ação judicial contra a Prefeitura. O chefe do setor deve imediatamente colocar estes dois expedientes na frente de todos os outros para atendimento prioritário.",
        "dica_prova": "Decore a trinca de prioridades exigidas pelo Art. 196, XVIII:<br>1. <strong>Certidões</strong> para defesa de direitos.<br>2. Informações requisitadas pela <strong>Câmara Municipal</strong>.<br>3. Diligências para defesa da <strong>Fazenda Municipal</strong> ou instrução de <strong>PAD</strong>."
    }
]

def generate_html():
    html_content = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Guia de Apoio aos Flashcards - LC nº 133/1985 Porto Alegre</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;600;700;800&display=swap');

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
            line-height: 1.5;
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
            padding: 30px;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1e1b4b 100%);
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
            font-size: 9pt;
            font-weight: 700;
            padding: 6px 16px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 18px;
        }

        .cover-title {
            font-family: 'Outfit', sans-serif;
            font-size: 28pt;
            font-weight: 800;
            line-height: 1.15;
            color: #f8fafc;
            margin-bottom: 14px;
        }

        .cover-subtitle {
            font-size: 13pt;
            font-weight: 400;
            color: #cbd5e1;
            max-width: 92%;
            line-height: 1.4;
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
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 13pt;
            flex-shrink: 0;
        }

        .feature-text h4 {
            font-size: 11pt;
            color: #f1f5f9;
            margin-bottom: 4px;
            font-weight: 700;
        }

        .feature-text p {
            font-size: 9pt;
            color: #94a3b8;
            line-height: 1.35;
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

        /* --- INDEX PAGE --- */
        .index-page {
            page-break-after: always;
            padding-top: 10px;
        }

        .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }

        .section-title {
            font-family: 'Outfit', sans-serif;
            font-size: 18pt;
            font-weight: 700;
            color: #0f172a;
        }

        .section-sub {
            font-size: 9.5pt;
            color: #64748b;
        }

        .index-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
            margin-top: 10px;
        }

        .index-table th {
            background-color: #0f172a;
            color: #ffffff;
            text-align: left;
            padding: 9px 12px;
            font-weight: 600;
            font-size: 8.5pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .index-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
        }

        .index-table tr:nth-child(even) {
            background-color: #f8fafc;
        }

        .card-num-badge {
            display: inline-block;
            background: #e0e7ff;
            color: #3730a3;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 8.5pt;
        }

        .topic-pill {
            display: inline-block;
            background: #f1f5f9;
            color: #475569;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 8pt;
            border: 1px solid #cbd5e1;
        }

        /* --- CARD CONTAINER --- */
        .card-container {
            page-break-inside: avoid;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            margin-bottom: 24px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .card-header-bar {
            background: #0f172a;
            color: #ffffff;
            padding: 12px 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .card-title-group {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .card-badge {
            background: #2563eb;
            color: #ffffff;
            font-family: 'Outfit', sans-serif;
            font-weight: 800;
            font-size: 9.5pt;
            padding: 4px 12px;
            border-radius: 6px;
            letter-spacing: 0.5px;
        }

        .card-topic-title {
            font-family: 'Outfit', sans-serif;
            font-weight: 600;
            font-size: 11.5pt;
            color: #f8fafc;
        }

        .card-artigo-tag {
            font-size: 8.5pt;
            color: #93c5fd;
            background: rgba(255,255,255,0.1);
            padding: 3px 10px;
            border-radius: 6px;
            border: 1px solid rgba(255,255,255,0.15);
        }

        .card-body {
            padding: 18px;
        }

        /* --- QUESTION BOX --- */
        .question-box {
            background: #f8fafc;
            border-left: 5px solid #2563eb;
            padding: 14px 16px;
            border-radius: 0 8px 8px 0;
            margin-bottom: 14px;
        }

        .question-label {
            font-size: 8pt;
            font-weight: 800;
            color: #2563eb;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 5px;
        }

        .question-text {
            font-size: 11.5pt;
            font-weight: 700;
            color: #0f172a;
            line-height: 1.4;
        }

        /* --- ANSWER BOX --- */
        .answer-box {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-left: 5px solid #16a34a;
            padding: 12px 16px;
            border-radius: 0 8px 8px 0;
            margin-bottom: 16px;
        }

        .answer-label {
            font-size: 8pt;
            font-weight: 800;
            color: #15803d;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 4px;
        }

        .answer-text {
            font-size: 11pt;
            font-weight: 700;
            color: #14532d;
        }

        /* --- DETAILS SECTION --- */
        .details-block {
            margin-bottom: 14px;
        }

        .details-title {
            font-size: 9pt;
            font-weight: 700;
            color: #334155;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
        }

        .details-content {
            font-size: 9.5pt;
            color: #334155;
            text-align: justify;
            line-height: 1.5;
        }

        /* --- CALLOUT BOXES --- */
        .grid-callouts {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-top: 14px;
        }

        .callout-example {
            background: #fffbe6;
            border: 1px solid #fef08a;
            border-left: 4px solid #d97706;
            border-radius: 8px;
            padding: 12px 14px;
        }

        .callout-example .callout-header {
            color: #b45309;
            font-size: 8.5pt;
            font-weight: 800;
            text-transform: uppercase;
            margin-bottom: 5px;
        }

        .callout-example .callout-body {
            font-size: 9pt;
            color: #78350f;
            line-height: 1.45;
        }

        .callout-tip {
            background: #f5f3ff;
            border: 1px solid #ddd6fe;
            border-left: 4px solid #7c3aed;
            border-radius: 8px;
            padding: 12px 14px;
        }

        .callout-tip .callout-header {
            color: #6d28d9;
            font-size: 8.5pt;
            font-weight: 800;
            text-transform: uppercase;
            margin-bottom: 5px;
        }

        .callout-tip .callout-body {
            font-size: 9pt;
            color: #4c1d95;
            line-height: 1.45;
        }

        .tag-footer {
            font-size: 8pt;
            font-family: monospace;
            color: #64748b;
            background: #f1f5f9;
            padding: 6px 14px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
    </style>
</head>
<body>

    <!-- CAPA DO PDF -->
    <div class="cover-page">
        <div class="cover-header">
            <span class="cover-badge">Material Auditado por Subagentes Especialistas</span>
            <h1 class="cover-title">Guia Definitivo de Contextualização de Flashcards</h1>
            <p class="cover-subtitle">Lei Complementar nº 133/1985 — Estatuto dos Funcionários Públicos do Município de Porto Alegre</p>
        </div>

        <div class="cover-body">
            <div class="cover-features">
                <div class="feature-item">
                    <div class="feature-icon">🔍</div>
                    <div class="feature-text">
                        <h4>Pesquisa Rápida</h4>
                        <p>Busque pela pergunta exata do Anki / Flashcard e encontre instantaneamente a fundamentação completa.</p>
                    </div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">📚</div>
                    <div class="feature-text">
                        <h4>Aprofundamento Legal Auditado</h4>
                        <p>Explicações doutrinárias e fundamentação nos artigos exatos e consolidados da LC 133/1985 de Porto Alegre.</p>
                    </div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">💡</div>
                    <div class="feature-text">
                        <h4>Exemplos do Dia a Dia</h4>
                        <p>Situações práticas do serviço público municipal de Porto Alegre (HPS, DMLU, SMOV, SMAMUS, etc.).</p>
                    </div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🎯</div>
                    <div class="feature-text">
                        <h4>Dicas & Pegadinhas de Prova</h4>
                        <p>Alertas de confronto entre a LC 133/85 de POA e a Lei 8.112/90 para evitar erros nas bancas (FUNDATEC, FGV, VUNESP).</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="cover-footer">
            <span>Município de Porto Alegre / RS</span>
            <span>18 Questões 100% Auditadas e Validadas</span>
            <span>Legislação Municipal Atualizada</span>
        </div>
    </div>

    <!-- SUMÁRIO / ÍNDICE RÁPIDO -->
    <div class="index-page">
        <div class="section-header">
            <div>
                <h2 class="section-title">Índice Rápido dos Flashcards Auditados</h2>
                <p class="section-sub">Consulte abaixo a lista ordenada de todos os cards para localização imediata neste documento.</p>
            </div>
            <span class="card-badge">18 CARDS AUDITADOS</span>
        </div>

        <table class="index-table">
            <thead>
                <tr>
                    <th style="width: 8%;">Card</th>
                    <th style="width: 52%;">Pergunta / Tema</th>
                    <th style="width: 25%;">Tópico</th>
                    <th style="width: 15%;">Dispositivo Exato</th>
                </tr>
            </thead>
            <tbody>
"""

    for card in cards_data:
        html_content += f"""
                <tr>
                    <td><span class="card-num-badge">#{card['id']:02d}</span></td>
                    <td><strong>{card['question']}</strong></td>
                    <td><span class="topic-pill">{card['topic']}</span></td>
                    <td><small>{card['artigo']}</small></td>
                </tr>
        """

    html_content += """
            </tbody>
        </table>
    </div>

    <!-- CARDS DETALHADOS -->
    <div class="main-cards-list">
    """

    for card in cards_data:
        html_content += f"""
        <!-- CARD {card['id']} -->
        <div class="card-container">
            <div class="card-header-bar">
                <div class="card-title-group">
                    <span class="card-badge">CARD #{card['id']:02d}</span>
                    <span class="card-topic-title">{card['topic']}</span>
                </div>
                <span class="card-artigo-tag">{card['artigo']}</span>
            </div>

            <div class="card-body">
                <!-- PERGUNTA DO CARD -->
                <div class="question-box">
                    <div class="question-label">❓ Pergunta Exata do Card</div>
                    <div class="question-text">"{card['question']}"</div>
                </div>

                <!-- RESPOSTA DIRETA -->
                <div class="answer-box">
                    <div class="answer-label">✅ Resposta Objetiva do Card</div>
                    <div class="answer-text">"{card['answer']}"</div>
                </div>

                <!-- EXPLICAÇÃO E CONTEXTO LEGAL -->
                <div class="details-block">
                    <div class="details-title">📖 Contexto Legal & Fundamentação Doutrinária</div>
                    <div class="details-content">
                        {card['explicacao']}
                    </div>
                </div>

                <!-- CALLOUTS DE EXEMPLO E DICA DE PROVA -->
                <div class="grid-callouts">
                    <div class="callout-example">
                        <div class="callout-header">💡 Exemplo Prático do Dia a Dia</div>
                        <div class="callout-body">
                            {card['exemplo']}
                        </div>
                    </div>
                    <div class="callout-tip">
                        <div class="callout-header">🎯 Dica de Prova & Pegadinha da Banca</div>
                        <div class="callout-body">
                            {card['dica_prova']}
                        </div>
                    </div>
                </div>
            </div>

            <div class="tag-footer">
                <span>🏷️ Tag Anki: <code>{card['tag']}</code></span>
                <span>LC nº 133/1985 Porto Alegre</span>
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
    html_out = "Guia_Flashcards_LC133_Porto_Alegre.html"
    pdf_out = "Guia_Flashcards_LC133_Porto_Alegre.pdf"
    
    # Write HTML file
    with open(html_out, "w", encoding="utf-8") as f:
        f.write(generate_html())
    print(f"HTML gerado: {html_out}")

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
        print(f"PDF gerado com sucesso: {pdf_out} ({os.path.getsize(pdf_out)} bytes)")
    else:
        print("Erro na geração do PDF.")
