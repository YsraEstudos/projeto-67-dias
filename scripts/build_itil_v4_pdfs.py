import os
import sys
import tempfile
import subprocess

DOWNLOADS_DIR = os.path.expanduser(r"~\Downloads")
if not os.path.exists(DOWNLOADS_DIR):
    DOWNLOADS_DIR = r"C:\Users\israe\Downloads"

PDF1_PATH = os.path.join(DOWNLOADS_DIR, "PDF_1_ITIL_v4_Apostila_Explicativa.pdf")
PDF2_PATH = os.path.join(DOWNLOADS_DIR, "PDF_2_ITIL_v4_Flashcards_Auditados.pdf")

print(f"Target PDF 1: {PDF1_PATH}")
print(f"Target PDF 2: {PDF2_PATH}")

CSS_TEXTBOOK = """
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600;700&display=swap');

@page {
    size: A4;
    margin: 22mm 20mm 22mm 20mm;
    @top-center {
        content: "Governança de TI no Setor Público — ITIL® 4 em Alta Performance";
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

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
    font-family: 'Lora', Georgia, serif;
    color: #1e293b;
    background-color: #ffffff;
    line-height: 1.75;
    font-size: 11pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

.cover-header {
    text-align: center;
    padding: 35px 20px 25px 20px;
    border-bottom: 2px solid #0f172a;
    margin-bottom: 30px;
}

.badge {
    font-family: 'Inter', sans-serif;
    font-size: 8.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #0284c7;
    margin-bottom: 10px;
}

.doc-title {
    font-family: 'Inter', sans-serif;
    font-size: 24pt;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.25;
    margin-bottom: 12px;
}

.doc-subtitle {
    font-family: 'Inter', sans-serif;
    font-size: 11.5pt;
    color: #475569;
    max-width: 90%;
    margin: 0 auto 15px auto;
    line-height: 1.5;
}

.doc-meta {
    font-family: 'Inter', sans-serif;
    font-size: 8.5pt;
    color: #64748b;
    font-style: italic;
}

h2.section-title {
    font-family: 'Inter', sans-serif;
    font-size: 15pt;
    font-weight: 700;
    color: #0f172a;
    margin: 28px 0 12px 0;
    padding-bottom: 4px;
    border-bottom: 1.5px solid #cbd5e1;
    page-break-after: avoid;
}

h3.subsection-title {
    font-family: 'Inter', sans-serif;
    font-size: 12.5pt;
    font-weight: 600;
    color: #0369a1;
    margin: 20px 0 8px 0;
    page-break-after: avoid;
}

p {
    margin-bottom: 14px;
    text-align: justify;
    text-justify: inter-word;
    text-indent: 1.5em;
}

p.no-indent {
    text-indent: 0;
}

ul, ol {
    margin: 10px 0 16px 25px;
}

li {
    margin-bottom: 6px;
    text-align: justify;
}

.example-box {
    background-color: #f8fafc;
    border-left: 4px solid #0284c7;
    padding: 12px 16px;
    margin: 16px 0;
    border-radius: 0 6px 6px 0;
    font-size: 10.2pt;
    line-height: 1.6;
    page-break-inside: avoid;
}

.example-box strong {
    font-family: 'Inter', sans-serif;
    color: #0369a1;
}

.trap-box {
    background-color: #fef2f2;
    border-left: 4px solid #ef4444;
    padding: 12px 16px;
    margin: 16px 0;
    border-radius: 0 6px 6px 0;
    font-size: 10.2pt;
    line-height: 1.6;
    page-break-inside: avoid;
}

.trap-box strong {
    font-family: 'Inter', sans-serif;
    color: #991b1b;
}

.card-container {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 18px 20px;
    margin-bottom: 24px;
    page-break-inside: avoid;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 10px;
    margin-bottom: 12px;
}

.card-number {
    font-family: 'Inter', sans-serif;
    font-size: 11pt;
    font-weight: 700;
    color: #0f172a;
}

.card-tag {
    font-family: 'Inter', sans-serif;
    font-size: 8pt;
    font-weight: 600;
    background-color: #e0f2fe;
    color: #0369a1;
    padding: 3px 8px;
    border-radius: 12px;
}

.card-question {
    font-family: 'Inter', sans-serif;
    font-size: 11pt;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 10px;
    line-height: 1.4;
}

.card-answer {
    background-color: #f0fdf4;
    border-left: 3.5px solid #16a34a;
    padding: 10px 14px;
    margin-bottom: 12px;
    font-size: 10.5pt;
    border-radius: 0 4px 4px 0;
}

.card-answer strong {
    font-family: 'Inter', sans-serif;
    color: #15803d;
}

.card-explanation {
    font-size: 10pt;
    color: #334155;
    margin-bottom: 10px;
    line-height: 1.6;
}

.card-example {
    font-size: 9.8pt;
    color: #1e293b;
    background-color: #f8fafc;
    border-left: 3.5px solid #0284c7;
    padding: 8px 12px;
    margin-bottom: 10px;
    border-radius: 0 4px 4px 0;
}

.card-trap {
    font-size: 9.8pt;
    color: #7f1d1d;
    background-color: #fff1f2;
    border-left: 3.5px solid #e11d48;
    padding: 8px 12px;
    border-radius: 0 4px 4px 0;
}
"""

def generate_pdf1_html():
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>PDF 1 - Apostila Explicativa ITIL 4 para Concursos Públicos</title>
    <style>{CSS_TEXTBOOK}</style>
</head>
<body>

    <div class="cover-header">
        <div class="badge">Apostila Pedagógica de Alto Rendimento • Concursos Públicos</div>
        <h1 class="doc-title">Governança de TI no Setor Público:<br>O Framework ITIL® 4 Descomplicado</h1>
        <div class="doc-subtitle">Um guia teórico-prático fluido e explicativo, abordando conceitos fundamentais, dimensões, o Sistema de Valor de Serviço (SVS), princípios orientadores e práticas de gerenciamento com foco em bancas examinadoras (FGV, CEBRASPE, FCC e VUNESP).</div>
        <div class="doc-meta">Elaborado por Professor Especialista & Engenheiro Pedagógico em Governança de TI</div>
    </div>

    <h2 class="section-title">1. Introdução à Governança de TI e a Revolução do ITIL® 4</h2>
    <p>Na era da transformação digital do Estado, a Governança e a Gestão de Tecnologia da Informação deixaram de ser meros suportes operacionais para se tornarem o motor central da prestação de serviços públicos de alto valor ao cidadão. Seja na emissão automatizada de uma Carteira de Identidade Nacional (CIN), no processamento de declarações de imposto de renda ou na gestão de prontuários eletrônicos no Sistema Único de Saúde (SUS), a TI pública precisa operar com eficiência, segurança e alinhamento estratégico.</p>
    <p>O <strong>ITIL® 4</strong> (Information Technology Infrastructure Library), mantido pela AXELOS, representa a mais recente evolução global da biblioteca de melhores práticas em Gerenciamento de Serviços de TI (GSTI). Enquanto as versões anteriores (como o ITIL v3/2011) focavam fortemente em uma estrutura relativamente rígida baseada no Ciclo de Vida do Serviço (Estratégia, Desenho, Transição, Operação e Melhoria Contínua), o ITIL 4 foi desenhado para atender às demandas de ambientes dinâmicos, integrando-se naturalmente com filosofias Ágeis, DevOps e Lean.</p>
    <p>A grande mudança paradigmática do ITIL 4 em relação ao ITIL v3 é a forma como o valor é percebido. No ITIL v3, considerava-se que o provedor de serviços "entregava valor" ao cliente de forma quase unilateral. No ITIL 4, o conceito central estabelece que o valor <strong>não é simplesmente entregue, mas co-criado ativamente</strong> por meio de uma colaboração contínua e transparente entre o provedor de serviços, os clientes, os usuários e demais partes interessadas (stakeholders).</p>

    <div class="example-box">
        <strong>Exemplo Prático no Setor Público:</strong> Imagine um Tribunal de Justiça que desenvolve um novo portal de peticionamento eletrônico para advogados e cidadãos. Se a Secretaria de TI apenas "entregar" o sistema pronto sem ouvir as partes interessadas, o sistema pode ser tecnicamente perfeito, mas inutilizável na prática. A co-criação de valor ocorre quando a TI (provedor) trabalha em conjunto com magistrados, servidores cartorários e a Ordem dos Advogados (clientes/usuários), ajustando fluxos de trabalho e interface de modo a gerar reais benefícios de celeridade processual.
    </div>

    <h2 class="section-title">2. As Quatro Dimensões do Gerenciamento de Serviços</h2>
    <p>Para garantir uma abordagem holística e evitar que as organizações foquem excessivamente na tecnologia em detrimento de pessoas ou processos, o ITIL 4 define <strong>quatro dimensões do gerenciamento de serviços</strong>. Todas as quatro dimensões são essenciais e aplicam-se a todo o Sistema de Valor de Serviço (SVS) e a cada serviço específico desenvolvido ou operado.</p>
    
    <h3 class="subsection-title">Dimensão 1: Organizações e Pessoas</h3>
    <p>Refere-se às estruturas organizacionais formais, papéis, responsabilidades, linhas de autoridade e, fundamentalmente, à cultura corporativa, competências e comunicação. Não basta instalar softwares avançados se a equipe de servidores e terceirizados não possuir treinamento adequado ou se a cultura organizacional for avessa à inovação e colaboração.</p>

    <h3 class="subsection-title">Dimensão 2: Informação e Tecnologia</h3>
    <p>Engloba as informações e conhecimentos necessários para o gerenciamento dos serviços, bem como as tecnologias utilizadas (bancos de dados, redes, servidores em nuvem, ferramentas de automação, inteligência artificial e arquiteturas de sistemas). No setor público, essa dimensão abrange também a conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e a interoperabilidade entre sistemas governamentais.</p>

    <h3 class="subsection-title">Dimensão 3: Parceiros e Fornecedores</h3>
    <p>Abrange o relacionamento da organização com outras empresas ou órgãos envolvidos no desenho, desenvolvimento, implantação e operação dos serviços. Na Administração Pública brasileira, essa dimensão ganha um contorno especial devido às contratações públicas regidas pela Lei de Licitações (Lei nº 14.133/2021), envolvendo fornecedores de outsourcing de TI, fábrica de software, links de telecomunicações e provedores de nuvem.</p>

    <h3 class="subsection-title">Dimensão 4: Fluxos de Valor e Processos</h3>
    <p>Define as atividades, procedimentos, papéis e fluxos de trabalho necessários para transformar insumos em entregas de valor. Um <em>fluxo de valor</em> (value stream) é uma combinação específica de atividades da cadeia de valor criada para responder a um cenário específico (por exemplo, a correção de um erro crítico em sistema de arrecadação ou o provisionamento de um novo computador para um servidor empossado).</p>

    <div class="trap-box">
        <strong>Pegadinha de Banca (FGV / CEBRASPE):</strong> As bancas costumam tentar incluir os fatores externos <strong>PESTLE</strong> (Político, Econômico, Social, Tecnológico, Legal e Ecológico/Ambiental) como se fossem a quinta ou sexta dimensão. Lembre-se: PESTLE representa os fatores externos que restringem e influenciam as 4 dimensões, mas <em>não</em> é uma das 4 dimensões! Outra pegadinha comum é substituir "Fluxos de Valor e Processos" por "Processos e Procedimentos". Fique atento!
    </div>

    <h2 class="section-title">3. O Sistema de Valor de Serviço (SVS)</h2>
    <p>O <strong>Sistema de Valor de Serviço (SVS)</strong> representa a estrutura de alto nível do ITIL 4. Ele descreve como todos os componentes e atividades da organização trabalham juntos de forma integrada como um sistema flexível para facilitar a criação contínua de valor.</p>
    <p>O SVS recebe como entradas a <strong>Oportunidade</strong> (possibilidade de criar valor para a organização ou cidadãos) e a <strong>Demanda</strong> (necessidade explicitada por serviços) e produz como saída o <strong>Valor</strong> gerado.</p>
    
    <p class="no-indent">O SVS é composto por <strong>cinco componentes centrais</strong>:</p>
    <ol>
        <li><strong>Princípios Orientadores (Guiding Principles):</strong> Recomendações duradouras que guiam a organização em qualquer circunstância.</li>
        <li><strong>Governança (Governance):</strong> O sistema pelo qual a organização é dirigida e controlada (alinhamento estratégico, monitoramento e avaliação).</li>
        <li><strong>Cadeia de Valor do Serviço (Service Value Chain):</strong> O modelo operacional central com 6 atividades que transformam demandas em produtos e serviços.</li>
        <li><strong>Práticas (Practices):</strong> Conjuntos de recursos organizacionais projetados para desempenhar um trabalho ou atingir um objetivo (34 práticas divididas em 3 categorias).</li>
        <li><strong>Melhoria Contínua (Continual Improvement):</strong> Uma prática e atividade recorrente em todos os níveis do SVS para garantir que o desempenho da organização atenda continuamente às expectativas.</li>
    </ol>

    <h2 class="section-title">4. Os 7 Princípios Orientadores (Guiding Principles)</h2>
    <p>Os Princípios Orientadores são conselhos práticos universalmente aplicáveis que orientam tomadas de decisão e ações no gerenciamento de serviços de TI, independentemente de mudanças em metas, estrutura organizacional ou tecnologia.</p>

    <ul style="list-style-type: square;">
        <li><strong>1. Foco no valor (Focus on value):</strong> Tudo o que a organização faz deve vincular-se, direta ou indiretamente, ao valor para os clientes e stakeholders. É preciso conhecer quem é o usuário final e o que realmente constitui valor para ele.</li>
        <li><strong>2. Comece de onde você está (Start where you are):</strong> Não descarte o que já existe para construir tudo do zero sem antes analisar. Deve-se reaproveitar processos, dados e tecnologias existentes que já funcionam bem.</li>
        <li><strong>3. Progrida iterativamente com feedback (Progress iteratively with feedback):</strong> Evite tentar fazer tudo de uma vez em grandes projetos monolíticos ("big bang"). Divida o trabalho em etapas menores e gerenciáveis (iterações) e utilize o feedback de cada etapa para ajustar o rumo.</li>
        <li><strong>4. Colabore e promova visibilidade (Collaborate and promote visibility):</strong> Trabalhe junto com equipes multidisciplinares e compartilhe informações abertamente. Decisões tomadas em "silos isolados" costumam falhar.</li>
        <li><strong>5. Pense e trabalhe holisticamente (Think and work holistically):</strong> Nenhum serviço ou componente funciona isoladamente. É preciso compreender a visão de conjunto e a interdependência de todas as partes.</li>
        <li><strong>6. Mantenha simples e prático (Keep it simple and practical):</strong> Use o menor número necessário de passos para atingir um objetivo (princípio do <em>minimal viable process</em>). Se um processo não agrega valor ou não produz um resultado útil, elimine-o.</li>
        <li><strong>7. Otimize e automatize (Optimize and automate):</strong> Maximize a eficiência dos recursos humanos e tecnológicos. <em>Atenção para a ordem:</em> primeiro simplifique e otimize o fluxo de trabalho; somente DEPOIS aplique a automação. Automatizar um processo ineficiente apenas gera desperdício em alta velocidade.</li>
    </ul>

    <h2 class="section-title">5. A Cadeia de Valor do Serviço (Service Value Chain)</h2>
    <p>A Cadeia de Valor do Serviço é o coração do SVS. Trata-se de um modelo operacional flexível que define <strong>seis atividades essenciais</strong> para a criação de valor por meio da produção e gestão de produtos e serviços de TI:</p>

    <ol>
        <li><strong>Planejar (Plan):</strong> Garantir uma compreensão compartilhada da visão, situação atual e direcionamento estratégico para todas as quatro dimensões.</li>
        <li><strong>Melhorar (Improve):</strong> Garantir a melhoria contínua de produtos, serviços e práticas em todas as atividades da cadeia de valor.</li>
        <li><strong>Engajar (Engage):</strong> Prover uma boa compreensão das necessidades dos stakeholders, transparência e bom relacionamento contínuo.</li>
        <li><strong>Desenhar e Transicionar (Design and transition):</strong> Garantir que os produtos e serviços atendam continuamente às expectativas de qualidade, custos e tempo de lançamento.</li>
        <li><strong>Obter/Construir (Obtain/build):</strong> Garantir que os componentes do serviço estejam disponíveis quando e onde forem necessários, atendendo às especificações acordadas.</li>
        <li><strong>Entregar e Suportar (Deliver and support):</strong> Garantir que os serviços sejam entregues e suportados de acordo com as especificações acordadas e expectativas dos clientes.</li>
    </ol>

    <h2 class="section-title">6. As 34 Práticas do ITIL® 4 e a Operação de Serviços</h2>
    <p>No ITIL 4, o termo "processo" (utilizado no ITIL v3) foi expandido para o conceito mais amplo de <strong>Práticas</strong>. Uma prática é um conjunto de recursos organizacionais (incluindo pessoas, processos, tecnologia e parceiros) projetados para desempenhar um trabalho. O ITIL 4 mapeia <strong>34 práticas</strong> divididas em 3 grandes grupos:</p>
    
    <ul>
        <li><strong>Práticas Gerais de Gerenciamento (14 práticas):</strong> Adaptadas de domínios gerais de negócios (ex: Gerenciamento de Risco, Gestão de Mudanças Organizacionais - OCM, Melhoria Contínua, Medição e Relatórios, Gerenciamento de Estratégia).</li>
        <li><strong>Práticas de Gerenciamento de Serviços (17 práticas):</strong> Desenvolvidas especificamente para o gerenciamento de serviços de TI (ex: Gestão de Incidentes, Gestão de Problemas, Habilitação de Mudança, Central de Serviços, Solicitação de Serviço, Catálogo de Serviços).</li>
        <li><strong>Práticas de Gerenciamento Técnico (3 práticas):</strong> Derivadas de domínios de engenharia de tecnologia (ex: Gestão de Implantação / <em>Deployment Management</em>, Gestão de Infraestrutura e Plataformas, Gerenciamento de Software).</li>
    </ul>

    <h3 class="subsection-title">Detalhamento das Principais Práticas Cobradas em Provas:</h3>

    <p><strong>Gestão de Incidentes (Incident Management):</strong> Tem como objetivo principal minimizar o impacto negativo de incidentes, restaurando a operação normal do serviço o mais rápido possível. Um <em>Incidente</em> é definido como uma interrupção não planejada de um serviço ou a redução de sua qualidade. Exemplo: a queda repentina do banco de dados do sistema de protocolo geral do Ministério.</p>

    <p><strong>Gestão de Problemas (Problem Management):</strong> Tem como objetivo reduzir a probabilidade e o impacto de incidentes, identificando suas causas raízes reais e potenciais e gerenciando <em>Erros Conhecidos (Known Errors)</em> e <em>Soluções de Contorno (Workarounds)</em>. Enquanto a Gestão de Incidentes foca no restabelecimento rápido (combater o incêndio), a Gestão de Problemas foca na investigação técnica profunda para evitar reincidências.</p>

    <p><strong>Solução de Contorno (Workaround) e Erro Conhecido (Known Error):</strong> Um <em>Workaround</em> é uma solução temporária que reduz ou elimina o impacto de um incidente ou problema para o qual a resolução definitiva ainda não existe (ex: reiniciar o serviço de impressão a cada 4 horas para evitar estouro de memória). Quando a causa raiz de um problema é identificada e documentada juntamente com um workaround, ele passa a ser classificado como um <em>Erro Conhecido (Known Error)</em>.</p>

    <p><strong>Habilitação de Mudança (Change Enablement / Controle de Mudança):</strong> Pertence às Práticas de Gerenciamento de Serviços. Seu objetivo é maximizar o número de mudanças bem-sucedidas em produtos e serviços de TI, garantindo que os riscos e impactos sejam devidamente avaliados antes de autorizar a execução. <em>Atenção:</em> Habilitação de Mudança avalia, autoriza e agenda a mudança; ela <strong>não</strong> move fisicamente os arquivos de software para o servidor de produção.</p>

    <p><strong>Gestão de Implantação (Deployment Management):</strong> É uma Prática de Gerenciamento Técnico. Seu propósito exato é mover hardware, software, documentação ou qualquer componente novo ou alterado para ambientes de teste ou produção. Não confunda com o <em>Gerenciamento de Liberação (Release Management)</em>, que torna os novos recursos efetivamente disponíveis aos usuários.</p>

    <p><strong>Central de Serviços (Service Desk):</strong> Atua como o Ponto Único de Contato (SPOC - Single Point of Contact) entre o provedor de serviços e os usuários. É responsável por capturar demandas de incidentes e solicitações de serviço. No ITIL 4, a Central de Serviços exige não apenas habilidades técnicas, mas uma forte dose de empatia, inteligência emocional e comunicação voltada ao cliente.</p>

    <p><strong>Solicitação de Serviço (Service Request):</strong> É uma requisição efetuada por um usuário para uma ação de serviço normal que foi pré-aprovada e não constitui uma falha ou incidente. Exemplos clássicos: solicitação de redefinição de senha, pedido de instalação de monitor adicional ou concessão de acesso a uma pasta na rede.</p>

    <p><strong>Gestão de Mudanças Organizacionais (Organizational Change Management - OCM):</strong> É uma Prática Geral de Gerenciamento voltada a garantir que as mudanças na organização sejam implementadas de forma suave e bem-sucedida, gerenciando os aspectos humanos da mudança (resistência, comunicação, treinamento e cultura).</p>

    <div class="example-box" style="margin-top: 25px;">
        <strong>Síntese para Gabaritar em Concursos:</strong>
        <ul style="margin: 8px 0 0 18px;">
            <li><strong>Valor:</strong> Co-criado entre provedor e partes interessadas.</li>
            <li><strong>SVS:</strong> 5 componentes (Princípios, Governança, Cadeia de Valor, Práticas, Melhoria Contínua).</li>
            <li><strong>Dimensões:</strong> 4 dimensões (Organizações/Pessoas, Informação/Tecnologia, Parceiros/Fornecedores, Fluxos de Valor/Processos). Fatores PESTLE são externos.</li>
            <li><strong>Incidente x Problema:</strong> Incidente = Foco no restabelecimento rápido do serviço. Problema = Foco na causa raiz e prevenção.</li>
            <li><strong>Habilitação de Mudança x Implantação:</strong> Habilitação = Avaliar/Autorizar riscos. Implantação (Deployment) = Mover bits e hardwares fisicamente.</li>
        </ul>
    </div>

</body>
</html>
"""

def generate_pdf2_html():
    cards_data = [
        {
            "num": 1,
            "tag": "Dimensões",
            "q": "No ITIL 4, quais são as quatro dimensões do gerenciamento de serviços necessárias para facilitar a criação de valor?",
            "a": "1. Organizações e pessoas; 2. Informação e tecnologia; 3. Parceiros e fornecedores; 4. Fluxos de valor e processos.",
            "exp": "As 4 dimensões representam os aspectos críticos que devem ser considerados holisticamente para garantir a eficiência na entrega de serviços. Elas aplicam-se a todo o SVS e a cada serviço individual.",
            "ex": "Em uma Secretaria de Fazenda Estadual, ao lançar o DVA (Documento de Arrecadação) eletrônico, o órgão deve estruturar os auditores e técnicos (Organizações/Pessoas), o banco de dados e nuvem (Informação/Tecnologia), o contrato com a fábrica de software contratada (Parceiros/Fornecedores) e o fluxo do requerimento até a homologação (Fluxos de Valor e Processos).",
            "trap": "PESTLE (Político, Econômico, Social, Tecnológico, Legal e Ecológico) são fatores externos que influenciam as 4 dimensões, mas NÃO constituem uma dimensão propriamente dita. Outra pegadinha é trocar 'Fluxos de valor e processos' por 'Processos e procedimentos'."
        },
        {
            "num": 2,
            "tag": "Conceitos Básicos",
            "q": "No ITIL 4, qual é o conceito central sobre a forma como o valor dos serviços é gerado?",
            "a": "O valor é co-criado ativamente por meio da colaboração entre o provedor de serviços, clientes e demais partes interessadas.",
            "exp": "Trata-se do divisor de águas entre o ITIL v3 (onde o valor era entregue unilateralmente pelo provedor) e o ITIL 4 (onde o valor exige a participação ativa e conjunta do cliente/usuário).",
            "ex": "No Poder Judiciário, a TI desenvolve o sistema de Processo Judicial Eletrônico (PJe). Se advogados e defensores não utilizarem as ferramentas de peticionamento corretamente, o valor (celeridade na prestação jurisdicional) não é atingido.",
            "trap": "Afirmativas afirmando que 'o valor é uma entrega exclusiva e autônoma do provedor de TI' estão INCORRETAS. No ITIL 4, o valor é estritamente CO-CRIADO."
        },
        {
            "num": 3,
            "tag": "SVS",
            "q": "O que é o Sistema de Valor de Serviço (SVS) no ITIL 4?",
            "a": "É a estrutura que descreve como todos os componentes e atividades da organização trabalham juntos para facilitar a criação de valor.",
            "exp": "O SVS funciona como a arquitetura macro do ITIL 4, recebendo Oportunidade e Demanda como entradas e entregando Valor como saída por meio de um sistema integrado e flexível.",
            "ex": "O Ministério da Gestão e da Inovação (MGI) utiliza o SVS para alinhar políticas públicas, contratações de TI, governança digital e plataformas de atendimento ao cidadão em todo o governo federal.",
            "trap": "Confundir o SVS com o Ciclo de Vida do Serviço do ITIL v3. O SVS é um ecossistema integrado e não um ciclo de fases estáticas sequenciais."
        },
        {
            "num": 4,
            "tag": "SVS",
            "q": "Quais são os cinco componentes centrais do Sistema de Valor de Serviço (SVS) no ITIL 4?",
            "a": "Princípios orientadores, Governança, Cadeia de valor do serviço, Práticas e Melhoria contínua.",
            "exp": "Os 5 componentes garantem a flexibilidade e sustentabilidade da governança organizando orientações, liderança, operações, recursos e aprimoramento constante.",
            "ex": "Uma agência reguladora aplica os Princípios para pautar decisões, a Governança para prestar contas à sociedade, a Cadeia de Valor para montar serviços de fiscalização, as Práticas para executar o dia a dia e a Melhoria Contínua para evoluir anualmente.",
            "trap": "Trocar 'Cadeia de Valor do Serviço' por 'Ciclo de Vida do Serviço' ou incluir 'Gerenciamento de Riscos' como se fosse um componente do SVS (quando na verdade é uma Prática Generalista)."
        },
        {
            "num": 5,
            "tag": "Princípios",
            "q": "Quais são os 7 princípios orientadores (Guiding Principles) do ITIL 4?",
            "a": "1. Foco no valor; 2. Comece de onde você está; 3. Progrida iterativamente com feedback; 4. Colabore e promova visibilidade; 5. Pense e trabalhe holisticamente; 6. Mantenha simples e prático; 7. Otimize e automatize.",
            "exp": "São diretrizes universais e atemporais que devem orientar a organização em qualquer iniciativa ou momento de tomada de decisão.",
            "ex": "Ao reformular o Portal da Transparência de uma Prefeitura: 1. Foca no cidadão; 2. Aproveita a base de dados existente; 3. Lança versões de teste quinzenais; 4. Reúne TI e Ouvidoria; 5. Analisa o impacto na rede; 6. Remove campos desnecessários; 7. Automatiza o extrato de dados.",
            "trap": "Verifique a pegadinha clássica em 'Otimize e automatize': a banca dirá 'Automatize para depois otimizar'. O correto é SEMPRE otimizar e simplificar primeiro, e só então automatizar!"
        },
        {
            "num": 6,
            "tag": "Cadeia de Valor",
            "q": "No ITIL 4, quais são as 6 atividades da Cadeia de Valor do Serviço (Service Value Chain)?",
            "a": "Planejar, Melhorar, Engajar, Desenhar e transicionar, Obter/construir e Entregar e suportar.",
            "exp": "São as atividades operacionais chave que compõem o modelo operacional da Cadeia de Valor. Elas podem ser encadeadas de várias formas para formar fluxos de valor específicos.",
            "ex": "Para disponibilizar um novo aplicativo de agendamento de consultas médicas na rede municipal, a TI executa: Engajar (ouvir cidadãos), Planejar (recursos), Desenhar/Transicionar (telas), Obter/Construir (código), Entregar/Suportar (disponibilizar nas lojas e atender suporte) e Melhorar (atualizações).",
            "trap": "Bancas misturam as 6 atividades da SVC com os 5 componentes do SVS ou com os Princípios Orientadores. Decore com a sigla/associação: P-M-E-DT-OC-ES."
        },
        {
            "num": 7,
            "tag": "Práticas",
            "q": "Em quais três grandes categorias se dividem as 34 práticas de gerenciamento do ITIL 4?",
            "a": "Práticas gerais de gerenciamento, Práticas de gerenciamento de serviços e Práticas de gerenciamento técnico.",
            "exp": "Divisão estrutural das 34 práticas: 14 Gerais (provenientes da administração geral), 17 de Serviços (específicas de GSTI) e 3 Técnicas (derivadas de engenharia de software e infraestrutura).",
            "ex": "No SERPRO: Gerenciamento de Risco (Geral), Gestão de Incidentes (Serviço) e Gestão de Implantação (Técnica).",
            "trap": "Trocar a quantidade de práticas em cada grupo ou mover uma prática de categoria (ex: afirmar que 'Gestão de Implantação' é uma Prática de Serviço, quando é Prática TÉCNICA)."
        },
        {
            "num": 8,
            "tag": "Práticas de Serviço",
            "q": "No ITIL 4, qual é o objetivo principal da prática de Gestão de Incidentes (Incident Management)?",
            "a": "Minimizar o impacto negativo de incidentes, restaurando a operação normal do serviço o mais rápido possível.",
            "exp": "Foco total na restauração da operacionalidade (disponibilidade) em menor tempo possível, utilizando contornabilidade temporária se necessário.",
            "ex": "Quando a rede Wi-Fi da biblioteca de uma universidade pública cai em dia de prova, o técnico aplica uma troca rápida de roteador de reserva para voltar a conexão imediatamente.",
            "trap": "Afirmar que a Gestão de Incidentes busca 'investigar a causa raiz de longo prazo'. Isso é objetivo da Gestão de PROBLEMAS!"
        },
        {
            "num": 9,
            "tag": "Práticas de Serviço",
            "q": "No ITIL 4, qual é o objetivo principal da prática de Gestão de Problemas (Problem Management)?",
            "a": "Reduzir a probabilidade e o impacto de incidentes identificando suas causas raízes reais e potenciais e gerenciando erros conhecidos.",
            "exp": "A Gestão de Problemas atua de forma preventiva e investigativa em 3 fases: Identificação do problema, Controle do problema (análise de causa raiz) e Controle do erro conhecido.",
            "ex": "Após o roteador da biblioteca ser trocado de emergência, a equipe de infraestrutura analisa os logs em laboratório e descobre uma falha de firmware que causou o superaquecimento.",
            "trap": "Confundir restauração rápida do serviço (Incidente) com identificação de causa raiz (Problema)."
        },
        {
            "num": 10,
            "tag": "Práticas de Serviço",
            "q": "No ITIL 4, qual é a diferença fundamental de objetivo entre a Gestão de Incidentes e a Gestão de Problemas?",
            "a": "Gestão de Incidentes foca no restabelecimento rápido do serviço; Gestão de Problemas foca em investigar a causa raiz para evitar recorrências.",
            "exp": "Trata-se do duelo clássico de bancas: Incidente = Foco no Sintoma e Restabelecimento Rápido; Problema = Foco na Causa Raiz e Prevenção.",
            "ex": "Servidor da Folha de Pagamento travou: dar reboot para reabrir o sistema = Incidente; descobrir por que estourou a memória buffer e corrigir o código = Problema.",
            "trap": "A banca narrará um cenário de 'apagar o incêndio' e perguntará a prática. Se o foco foi restabelecer a operação rapidamente, o gabarito é Gestão de Incidentes."
        },
        {
            "num": 11,
            "tag": "Práticas de Serviço",
            "q": "No ITIL 4, a qual categoria pertence o Controle de Mudança (Change Control) e qual seu objetivo?",
            "a": "Pertence às Práticas de Gerenciamento de Serviços; busca maximizar o número de mudanças bem-sucedidas por meio da avaliação correta de riscos e impactos.",
            "exp": "No ITIL 4 oficial em inglês, o nome da prática foi atualizado para Change Enablement (Habilitação de Mudança). O foco é balancear a necessidade de mudança com a gestão de riscos.",
            "ex": "Antes de atualizar a versão do Banco de Dados do Tribunal de Contas, a equipe submete uma solicitação de mudança ao Comitê de Avaliação de Mudanças (CAB) para analisar impactos.",
            "trap": "A banca pode usar tanto 'Controle de Mudança' (tradução inicial) quanto 'Habilitação de Mudança' (Change Enablement). Além disso, lembre-se: Habilitação de Mudança NÃO faz a implantação técnica nos servidores!"
        },
        {
            "num": 12,
            "tag": "Práticas de Serviço",
            "q": "No ITIL 4, qual é a função e o escopo da Central de Serviços (Service Desk)?",
            "a": "Atuar como ponto único de contato (SPOC) entre o provedor e os usuários para capturar demandas de incidentes e solicitações de serviço.",
            "exp": "A Central de Serviços é a 'vitrine' e a 'voz' da TI. Ela acolhe, registra, tria e direciona requisições de serviço e relatos de falha.",
            "ex": "Um servidor público liga para o ramal 156 ou abre um chamado via portal pedindo um novo monitor ou reportando que sua impressora parou de funcionar.",
            "trap": "Dizer que o Service Desk lida apenas com incidentes graves ou que requer apenas habilidades técnicas profundas. O ITIL 4 enfatiza empatia, comunicação e inteligência emocional na Central de Serviços."
        },
        {
            "num": 13,
            "tag": "Práticas Gerais",
            "q": "No ITIL 4, a Gestão de Mudanças Organizacionais (Organizational Change Management) pertence a qual categoria e qual seu foco?",
            "a": "É uma Prática Geral de Gerenciamento; seu foco é gerenciar o elemento humano das mudanças na organização.",
            "exp": "Enquanto o Change Enablement cuida das alterações em sistemas e serviços de TI, a OCM cuida das pessoas, minimizando a resistência e promovendo a adesão a novas ferramentas.",
            "ex": "Ao migrar o sistema de processo físico para processo 100% eletrônico no Ministério Público, a OCM faz palestras, treinamentos e gestão da ansiedade dos servidores veteranos.",
            "trap": "Confundir Organizational Change Management (OCM - Gestão do Fator Humano, Prática Geral) com Change Enablement (Habilitação de Mudança em TI, Prática de Serviço)."
        },
        {
            "num": 14,
            "tag": "Práticas Gerais",
            "q": "Quais são exemplos de Práticas Gerais de Gerenciamento no ITIL 4?",
            "a": "Gerenciamento de risco, Melhoria contínua, Gerenciamento de estratégia e Medição e relatórios.",
            "exp": "São práticas adotadas da administração corporativa global e aplicadas ao contexto de TI (total de 14 práticas gerais).",
            "ex": "Elaborar a matriz de riscos de TI de um órgão público conforme diretrizes do TCU é uma aplicação do Gerenciamento de Riscos.",
            "trap": "A banca colocar 'Gestão de Incidentes' ou 'Central de Serviços' na lista de Práticas Gerais. Lembre-se: essas pertencem às Práticas de GERENCIAMENTO DE SERVIÇOS."
        },
        {
            "num": 15,
            "tag": "Práticas Técnicas",
            "q": "No ITIL 4, a Gestão de Implantação (Deployment Management) pertence a qual categoria de prática e qual seu propósito?",
            "a": "É uma Prática de Gerenciamento Técnico; seu propósito é mover hardware, software ou componentes novos ou alterados para ambientes de produção ou teste.",
            "exp": "Deployment é o ato físico/digital de transferir e instalar os componentes no ambiente de destino. É uma das 3 Práticas de Gerenciamento Técnico do ITIL 4.",
            "ex": "A equipe de DevOps do Dataprev executa o script do pipeline CI/CD para copiar os arquivos compilados do novo módulo para os servidores de produção.",
            "trap": "Confundir Deployment Management (mover componentes) com Release Management (tornar os recursos disponíveis para uso dos usuários) ou com Change Enablement (autorizar a mudança)."
        },
        {
            "num": 16,
            "tag": "Práticas de Serviço",
            "q": "Como o ITIL 4 define uma Solicitação de Serviço (Service Request)?",
            "a": "Uma requisição de um usuário para uma ação de serviço normal (ex: alteração de senha ou entrega de equipamento) que não seja uma falha.",
            "exp": "Trata-se de pedidos de rotina pré-aprovados e com procedimentos padronizados que não decorrem de interrupções ou erros no serviço.",
            "ex": "Servidor recém-empossado solicita a criação de sua conta de e-mail institucional e concessão de token de acesso.",
            "trap": "Tratar Solicitação de Serviço como Incidente. Se o usuário está pedindo algo novo/rotineiro sem que nada tenha quebrado, é Solicitação de Serviço!"
        },
        {
            "num": 17,
            "tag": "Práticas de Serviço",
            "q": "No ITIL 4, qual é a finalidade da prática de Gestão de Catálogo de Serviços?",
            "a": "Prover uma fonte única de informação consistente sobre todos os serviços e ofertas disponíveis para partes interessadas.",
            "exp": "O Catálogo de Serviços disponibiliza a visão clara dos serviços ativos, suas condições de acesso, SLAs e público-alvo.",
            "ex": "O Portal de Serviços de TI da Polícia Federal onde qualquer agente pode visualizar os sistemas disponíveis, prazos de suporte e como solicitar permissões.",
            "trap": "Confundir o Catálogo de Serviços (visão de serviços ativos/disponíveis) com o Portfólio de Serviços (visão completa que inclui serviços em desenvolvimento e aposentados)."
        },
        {
            "num": 18,
            "tag": "Conceitos Básicos",
            "q": "Como o ITIL 4 define o conceito de Incidente?",
            "a": "Uma interrupção não planejada de um serviço de TI ou a redução na qualidade de um serviço de TI.",
            "exp": "A palavra-chave obrigatória é NÃO PLANEJADA. Se houve parada programada para manutenção informada previamente, não se trata de incidente.",
            "ex": "O link de internet dedicado do Fórum caiu durante uma audiência telepresencial presenciando indisponibilidade total do sistema.",
            "trap": "Questões que afirmam que 'uma manutenção preventiva programada é um incidente'. INCORRETO! Manutenções programadas são Mudanças Padrão/Planejadas."
        },
        {
            "num": 19,
            "tag": "Práticas de Serviço",
            "q": "No ITIL 4, o que caracteriza um Erro Conhecido (Known Error)?",
            "a": "Um problema cuja causa raiz já foi analisada e possui uma solução de contorno (workaround) documentada.",
            "exp": "O Erro Conhecido é um estágio amadurecido do gerenciamento de problemas. A causa é sabida e existe contorno rápido enquanto a solução definitiva não vem.",
            "ex": "A TI sabe que o módulo de impressão falha se o documento tiver mais de 500 páginas (causa raiz) e orienta fatiar o arquivo em 2 partes (workaround).",
            "trap": "Afirmar que o Erro Conhecido já possui a 'solução definitiva aplicada'. Errado! Ele possui a causa identificada e uma Solução de Contorno (Workaround) documentada."
        },
        {
            "num": 20,
            "tag": "Práticas de Serviço",
            "q": "O que é uma Solução de Contorno (Workaround) no ITIL 4?",
            "a": "Uma solução temporária que reduz ou elimina o impacto de um incidente ou problema para o qual a resolução definitiva ainda não está disponível.",
            "exp": "É o famoso 'quebra-galho técnico oficial'. Não resolve a causa raiz no código, mas restabelece ou atenua a dor do usuário imediatamente.",
            "ex": "Instruir os usuários a utilizar o navegador Firefox enquanto o patch de compatibilidade para o Chrome está sendo desenvolvido.",
            "trap": "A banca dizer que 'Workaround elimina a causa raiz do problema'. Falso! Ele elimina ou reduz apenas o IMPACTO ou sintoma temporariamente."
        }
    ]

    cards_html = ""
    for c in cards_data:
        cards_html += f"""
        <div class="card-container">
            <div class="card-header">
                <span class="card-number">CARD {c['num']:02d}</span>
                <span class="card-tag">{c['tag']}</span>
            </div>
            <div class="card-question"><strong>Pergunta:</strong> {c['q']}</div>
            <div class="card-answer"><strong>Resposta Auditada / Gabarito:</strong> {c['a']}</div>
            <div class="card-explanation"><strong>Fundamentação & Explicação Teórica:</strong> {c['exp']}</div>
            <div class="card-example"><strong>Exemplo Prático na Administração Pública:</strong> {c['ex']}</div>
            <div class="card-trap"><strong>Atenção para Provas / Pegadinhas das Bancas:</strong> {c['trap']}</div>
        </div>
        """

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>PDF 2 - Flashcards Auditados e Explicados ITIL 4</title>
    <style>{CSS_TEXTBOOK}</style>
</head>
<body>

    <div class="cover-header">
        <div class="badge">Documento de Referência Direta • Flashcards Auditados</div>
        <h1 class="doc-title">ITIL® 4: Auditoria Pedagógica e Gabarito Comentado dos Cards</h1>
        <div class="doc-subtitle">Análise minuciosa card a card dos 20 flashcards exportados do AnkiDroid, contendo perguntas originais, respostas auditadas, fundamentação teórica AXELOS ITIL 4, exemplos reais no Setor Público e mapa de pegadinhas para bancas examinadoras.</div>
        <div class="doc-meta">Elaborado por Professor Especialista & Engenheiro Pedagógico em Governança de TI</div>
    </div>

    {cards_html}

</body>
</html>
"""

def compile_pdf(html_content, output_pdf_path):
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(html_content)
        temp_html = f.name

    tmp_user_data = tempfile.mkdtemp()
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    
    cmd = [
        edge_path,
        "--headless",
        "--disable-gpu",
        f"--user-data-dir={tmp_user_data}",
        f"--print-to-pdf={os.path.abspath(output_pdf_path)}",
        "--no-pdf-header-footer",
        os.path.abspath(temp_html)
    ]
    
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        if os.path.exists(output_pdf_path):
            size_kb = os.path.getsize(output_pdf_path) / 1024
            print(f"[SUCESSO] PDF Gerado: {output_pdf_path} ({size_kb:.1f} KB)")
            return True
        else:
            print(f"[ERRO] Falha ao gerar PDF em {output_pdf_path}")
            return False
    finally:
        if os.path.exists(temp_html):
            try:
                os.remove(temp_html)
            except Exception:
                pass

if __name__ == "__main__":
    print("Iniciando geração do PDF 1 (Apostila Explicativa)...")
    html1 = generate_pdf1_html()
    ok1 = compile_pdf(html1, PDF1_PATH)

    print("Iniciando geração do PDF 2 (Flashcards Auditados)...")
    html2 = generate_pdf2_html()
    ok2 = compile_pdf(html2, PDF2_PATH)

    if ok1 and ok2:
        print("AMBOS OS PDFS FORAM GERADOS COM SUCESSO EM DOIS ARQUIVOS NA PASTA DOWNLOADS!")
    else:
        sys.exit(1)
