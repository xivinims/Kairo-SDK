// Termos de Serviço e Política de Privacidade do Kairo AI
// Documento exaustivo com mais de 3.000 palavras, cláusulas regulatórias completas e conformidade com LGPD, Marco Civil da Internet e normas globais de IA.

export interface LegalSection {
  id: string;
  title: string;
  content: string[];
}

export const TERMS_OF_SERVICE: LegalSection[] = [
  {
    id: "tos-1",
    title: "1. PREÂMBULO, IDENTIFICAÇÃO E ACEITAÇÃO FORMAL DOS TERMOS",
    content: [
      "1.1. Bem-vindo ao Kairo AI. Estes Termos de Serviço (\"Termos\", \"Contrato\", \"Termos de Uso\") regem de forma irrestrita, vinculante e obrigatória o acesso, navegação e utilização da plataforma inteligente de assistência pessoal, conversação, computação cognitiva e geração textual Kairo AI (\"Kairo\", \"Plataforma\", \"Sistema\", \"Nós\", \"Nosso\").",
      "1.2. A Plataforma Kairo AI é um ecossistema de software de inteligência artificial de última geração, concebido para oferecer diálogo fluido, assistência produtiva, personificação criativa (personas), gerenciamento de projetos e interfaces digitais adaptativas.",
      "1.3. AO CLICAR EM \"LOGIN COM O GOOGLE\", AO ACESSAR OU UTILIZAR QUALQUER FUNCIONALIDADE DO KAIRO AI, VOCÊ (\"USUÁRIO\", \"VOCÊ\", \"TITULAR\") DECLARA DE FORMA LIVRE, EXPRESSA, INFORMADA E INEQUÍVOCA QUE LEU, COMPREENDEU INTEGRALMENTE E ACEITA SEM QUAISQUER RESERVAS OU RESSALVAS A TOTALIDADE DESTES TERMOS E A NOSSA POLÍTICA DE PRIVACIDADE E PROTEÇÃO DE DADOS.",
      "1.4. Caso discorde de qualquer cláusula, condição, obrigação, limitação ou diretriz prevista neste instrumento legal, Você deverá abster-se imediatamente de utilizar o Kairo AI, desconectar-se de sua conta e cessar todo e qualquer tráfego de dados com nossos servidores.",
      "1.5. A utilização continuada da Plataforma após a promulgação de revisões ou aditivos constituirá aceitação tácita e ratificação irrevogável dos novos termos contratuais vigentes."
    ]
  },
  {
    id: "tos-2",
    title: "2. ELEGIBILIDADE, CAPACIDADE CIVIL E REQUISITOS DE IDADE",
    content: [
      "2.1. O acesso e uso do Kairo AI é estritamente restrito a pessoas naturais dotadas de plena capacidade jurídica civil para contratar e assumir obrigações segundo as leis da República Federativa do Brasil e/ou da jurisdição territorial em que o Usuário se encontre.",
      "2.2. O Usuário deve ter no mínimo 13 (treze) anos de idade para utilizar a Plataforma. Caso o Usuário possua entre 13 e 18 anos de idade (ou a maioridade legal civil em seu domicílio), a utilização dos serviços somente será lícita caso haja prévia supervisão, autorização e consentimento expresso de seus pais ou responsáveis legais, que assumirão responsabilidade solidária por toda e qualquer conduta ou conteúdo veiculado.",
      "2.3. É expressamente vedado o uso da Plataforma por indivíduos que tenham sido previamente banidos, bloqueados, notificados judicialmente ou rescindidos por infração a estes Termos, normas de segurança ou legislação penal aplicável.",
      "2.4. A Plataforma reserva-se o direito soberano de implementar a qualquer momento verificações de idade, autenticações de segurança em duas etapas (2FA) e validações cadastrais complementares."
    ]
  },
  {
    id: "tos-3",
    title: "3. AUTENTICAÇÃO VIA GOOGLE, CRIAÇÃO DE CONTA E SEGURANÇA",
    content: [
      "3.1. O acesso ao Kairo AI é realizado prioritariamente por meio de autenticação federada (Single Sign-On - SSO) provida pelo Google LLC (\"Google Sign-In\"). Ao autenticar-se via Google, o Usuário autoriza o Kairo a receber identificadores básicos de seu perfil público (nome de exibição, endereço de e-mail e foto de perfil / avatar).",
      "3.2. O Usuário é o único, exclusivo e integral responsável por manter a confidencialidade, integridade e sigilo das credenciais de sua conta Google associada. Toda e qualquer ação, interação, envio de mensagem, comando de voz ou exclusão realizada a partir da conta autenticada será presumida como executada pessoal e voluntariamente pelo respectivo titular.",
      "3.3. O Usuário compromete-se a notificar a equipe de suporte e segurança do Kairo AI imediatamente caso tome conhecimento ou suspeite de qualquer violação de segurança, acesso não autorizado, extravio de dispositivo autenticado ou comprometimento de suas credenciais Google.",
      "3.4. O Kairo AI não se responsabiliza por quaisquer perdas, danos, lucros cessantes, corrupção de dados ou prejuízos imateriais decorrentes da inobservância por parte do Usuário de seus deveres de proteção e segurança de conta.",
      "3.5. Não é permitida a cessão, locação, sublicenciamento, doação, venda ou transferência de contas a terceiros sem prévia anuência por escrito da administração da Plataforma."
    ]
  },
  {
    id: "tos-4",
    title: "4. CRIAÇÃO, EDIÇÃO E GESTÃO DE PERSONAS (PERFIS DE CHAT)",
    content: [
      "4.1. O Kairo AI disponibiliza recurso avançado de personificação que permite ao Usuário criar, parametrizar, personalizar e manter seus próprios perfis de chat (\"Personas\", \"Perfis de Personagem\"), definindo dados como nome fictício, faixa etária, identidade de gênero, fotografia de avatar e biografia narrativa comportamental.",
      "4.2. O Usuário reconhece e concorda que TODOS OS PERSONAS EXIBIDOS EM SUA PLATAFORMA SÃO EXCLUSIVAMENTE AQUELES CRIADOS DE FORMA VOLUNTÁRIA PELO PRÓPRIO USUÁRIO. O Sistema garante que não serão mantidos personas pré-configurados ou genéricos indesejados.",
      "4.3. Ao cadastrar um Persona, o Usuário outorga ao Kairo AI licença técnica temporária e não exclusiva de processar as diretrizes narrativas desse persona nos modelos de inteligência artificial unicamente para gerar as respostas personalizadas solicitadas pelo próprio Usuário.",
      "4.4. É ESTRITAMENTE PROIBIDO criar Personas que:",
      "a) Representem, façam-se passar ou simulem pessoas vivas sem expressa autorização formal por escrito, constituindo falsidade ideológica ou difamação;",
      "b) Promovam assédio, ódio racial, violência explícita, discriminação religiosa, homofobia, transfobia, racismo ou xenofobia;",
      "c) Violem marcas registradas, direitos autorais de franquias ou patentes protegidas por lei;",
      "d) Tenham como objetivo fraudar terceiros, disseminar campanhas de desinformação (fake news) ou praticar engenharia social maliciosa;",
      "e) Envolvam conteúdos impróprios, pedofilia, exploração infantil ou violência sexual contra menores (sujeito a banimento perpétuo e denúncia imediata às autoridades competentes).",
      "4.5. O Kairo AI reserva-se o direito de remover unilateralmente qualquer Persona que desrespeite as diretrizes morais, legais e de segurança desta Plataforma."
    ]
  },
  {
    id: "tos-5",
    title: "5. DIRETRIZES DE USO ACEITÁVEL E CONDUTAS VEDADAS",
    content: [
      "5.1. O Usuário obriga-se a utilizar o Kairo AI em estrita consonância com a ordem pública, bons costumes, a legislação penal e civil brasileira (inclusive o Marco Civil da Internet, Lei nº 12.965/2014) e as boas práticas de convivência digital internacional.",
      "5.2. São condutas taxativamente PROIBIDAS no Kairo AI, sujeitas a sanções civis e criminais:",
      "a) Praticar engenharia reversa, descompilação, desmontagem (reverse engineering / disassembly) ou tentar extrair o código-fonte, prompts de sistema, pesos neurais ou parâmetros confidenciais do Kairo AI;",
      "b) Utilizar robôs, spiders, scrapers, crawlers ou quaisquer ferramentas automatizadas para minerar dados, replicar o banco de conversas ou sobrecarregar a infraestrutura de servidores;",
      "c) Injetar vírus, worms, cavalos de Tróia, exploits de buffer overflow, scripts maliciosos ou qualquer artefato de código que interfira no funcionamento sadio da rede;",
      "d) Tentar burlar ou sobrepujar as restrições de limites de taxa (rate limiting), tokens por minuto, mecanismos de moderação de conteúdo (safety guardrails) ou filtros de segurança de IA;",
      "e) Empregar o Kairo AI para o desenvolvimento de armas de destruição em massa, armas cibernéticas autônomas, ataques de negação de serviço (DDoS) ou infrações críticas de infraestrutura nacional;",
      "f) Utilizar a Plataforma para emitir diagnósticos médicos definitivos, prescrições de substâncias controladas, consultoria jurídica sem habilitação profissional ou recomendações financeiras especulativas sem conformidade regulatória;",
      "g) Promover autoflagelação, ideação suicida, distúrbios alimentares graves ou incentivar a prática de atentados contra a vida de qualquer ser vivo."
    ]
  },
  {
    id: "tos-6",
    title: "6. NATUREZA DAS RESPOSTAS DE INTELIGÊNCIA ARTIFICIAL E ALUCINAÇÕES",
    content: [
      "6.1. O Usuário declara-se expressamente ciente de que as respostas, sugestões, textos, códigos e narrativas fornecidas pelo Kairo AI são geradas por algoritmos probabilísticos de aprendizado de máquina profundo (Large Language Models - LLMs) operados em servidores de nuvem de alta capacidade.",
      "6.2. DEVIDO À NATUREZA MATEMÁTICA ESTATÍSTICA DA IA GENERATIVA, O KAIRO AI PODE OCASIONALMENTE GERAR INFORMAÇÕES IMPRECISAS, INCOMPLETAS, FALSAS OU OBSOLETAS, FENÔMENO CONHECIDO COMO \"ALUCINAÇÃO DE MODELO\" (MODEL HALLUCINATION).",
      "6.3. NENHUMA RESPOSTA DO KAIRO AI DEVE SER CONSIDERADA COMO CONSELHO PROFISSIONAL, MÉDICO, JURÍDICO, CONTÁBIL, PSICOLÓGICO OU FINANCEIRO DEFINITIVO. O Usuário é exclusivamente responsável por validar criticamente quaisquer informações factuais fornecidas pela IA antes de tomar decisões financeiras, médicas, contratuais ou pessoais de impacto.",
      "6.4. O Kairo AI e seus desenvolvedores isentam-se integralmente de qualquer responsabilidade por decisões, perdas patrimoniais, interpretações errôneas ou danos decorrentes da confiança cega nas respostas emitidas pelos modelos generativos."
    ]
  },
  {
    id: "tos-7",
    title: "7. PROPRIEDADE INTELECTUAL E DIREITOS SOBRE O CONTEÚDO",
    content: [
      "7.1. Todos os direitos de propriedade intelectual relativos ao software Kairo AI, incluindo, sem limitação, a sua arquitetura de sistema, designs visuais, logotipo, paleta de cores, componentes de interface, bibliotecas de estilo, código TypeScript/JavaScript, documentação técnica, banco de dados e marcas comerciais registradas ou não registradas, pertencem com exclusividade ao Kairo AI e seus legítimos titulares.",
      "7.2. Estes Termos concedem ao Usuário uma licença pessoal, revogável, intransferível, não sublicenciável e não exclusiva para acessar e utilizar a aplicação estritamente para seus fins individuais em conformidade com este Contrato.",
      "7.3. Quanto aos dados inseridos pelo Usuário (inputs e prompts) e às respostas geradas (outputs), na extensão permitida pela legislação aplicável, o Usuário detém a titularidade sobre o seu conteúdo gerado, outorgando ao Kairo AI apenas a licença estritamente necessária para executar, processar e exibir tais dados na interface do próprio Usuário."
    ]
  },
  {
    id: "tos-8",
    title: "8. PROVEDORES EXTERNOS DE IA, MODELOS E CONECTIVIDADE",
    content: [
      "8.1. Para entregar a melhor experiência de inteligência artificial, o Kairo AI pode permitir a conexão e comunicação com provedores de modelos de ponta, tais como Anthropic, Google Gemini, OpenAI, Groq, xAI e outros integradores autorizados.",
      "8.2. Quando o Usuário optar por configurar chaves de API próprias (BYOK - Bring Your Own Key) para provedores terceiros, o Usuário reconhece que a relação de consumo e tarifação com tal provedor rege-se pelos termos e políticas desse terceiro, não tendo o Kairo AI ingerência ou responsabilidade financeira sobre créditos, cobranças de API ou indisponibilidades de tais redes.",
      "8.3. O Kairo AI compromete-se a armazenar chaves de API fornecidas pelo Usuário em ambiente seguro local de seu navegador e/ou servidores criptografados, jamais compartilhando tais credenciais com outros usuários ou entidades não autorizadas."
    ]
  },
  {
    id: "tos-9",
    title: "9. LIMITAÇÃO DE RESPONSABILIDADE E AUSÊNCIA DE GARANTIAS",
    content: [
      "9.1. O KAIRO AI É FORNECIDO NO ESTADO EM QUE SE ENCONTRA (\"AS IS\") E CONFORME DISPONÍVEL (\"AS AVAILABLE\"), SEM QUAISQUER GARANTIAS EXPRESSAS, IMPLÍCITAS OU LEGAIS, INCLUINDO, MAS NÃO SE LIMITANDO A, GARANTIAS DE COMERCIABILIDADE, ADEQUAÇÃO A UMA FINALIDADE ESPECÍFICA, NÃO VIOLAÇÃO OU DISPONIBILIDADE ININTERRUPTA.",
      "9.2. NÃO GARANTIMOS QUE A PLATAFORMA FUNCIONARÁ SEM ERROS, QUE QUALQUER FALHA SERÁ CORRIGIDA IMEDIATAMENTE OU QUE OS SERVIDORES ESTARÃO IMUNES A ATAQUES DE HACKERS, INSTABILIDADES DE NUVEM OU INTERRUPÇÕES DE FORNECIMENTO DE INTERNET.",
      "9.3. EM NENHUMA HIPÓTESE O KAIRO AI, SEUS DIRETORES, DESENVOLVEDORES, PREPOSTOS OU PARCEIROS SERÃO RESPONSABILIZADOS POR DANOS INDIRETOS, INCIDENTAIS, ESPECIAIS, PUNITIVOS OU CONSEQUENCIAIS, PERDA DE LUCROS, PERDA DE DADOS, CUSTO DE OBTENÇÃO DE BENS OU SERVIÇOS SUBSTITUTOS, SEJA SOB TEORIA DE CONTRATO, RESPONSABILIDADE CIVIL OU QUALQUER OUTRO FUNDAMENTO LEGAL, AINDA QUE AVISADOS DA POSSIBILIDADE DE TAIS DANOS.",
      "9.4. NOS CASOS EM QUE A LEGISLAÇÃO APLICÁVEL NÃO PERMITA A LIMITAÇÃO TOTAL DE RESPONSABILIDADE, A RESPONSABILIDADE MÁXIMA CUMULATIVA DO KAIRO AI PERANTE O USUÁRIO LIMITAR-SE-Á AO VALOR TOTAL EFETIVAMENTE PAGO PELO USUÁRIO À PLATAFORMA NOS ÚLTIMOS 3 (TRÊS) MESES ANTERIORES AO EVENTO DANOSO, OU AO EQUIVALENTE A R$ 100,00 (CEM REAIS), O QUE FOR MENOR."
    ]
  },
  {
    id: "tos-10",
    title: "10. INDENIZAÇÃO POR CONDUTAS ILÍCITAS DO USUÁRIO",
    content: [
      "10.1. O Usuário concorda em defender, indenizar e manter indene o Kairo AI, suas afiliadas, administradores, desenvolvedores e parceiros comerciais contra quaisquer reclamações judiciais ou extrajudiciais, perdas, passivos, despesas, multas administrativas e honorários advocatícios decorrentes de:",
      "a) Violação pelo Usuário de qualquer disposição destes Termos de Serviço ou da Política de Privacidade;",
      "b) Uso indevido, fraudulento ou criminoso da inteligência artificial disponibilizada;",
      "c) Violação de direitos de terceiros, incluindo direitos autorais, de imagem, privacidade ou honra pessoal cometida por meio dos dados ou Personas cadastrados pelo Usuário;",
      "d) Fornecimento de dados inverídicos ou violação dolosa de normas de segurança."
    ]
  },
  {
    id: "tos-11",
    title: "11. MODIFICAÇÕES DOS SERVIÇOS, SUSPENSÃO E CANCELAMENTO",
    content: [
      "11.1. O Kairo AI reserva-se o direito unilateral de, a qualquer tempo e a seu exclusivo critério, modificar, aprimorar, suspender temporariamente ou descontinuar permanentemente quaisquer funcionalidades, modelos de linguagem suportados, limites de processamento ou a própria Plataforma, com ou sem aviso prévio.",
      "11.2. O Kairo AI poderá suspender ou encerrar imediatamente o acesso do Usuário à sua conta, sem aviso prévio e sem direito a qualquer indenização, nas seguintes hipóteses:",
      "a) Descumprimento comprovado ou indício substancial de violação destes Termos de Serviço;",
      "b) Requisito legal emanado por autoridade judiciária ou órgão governamental competente;",
      "c) Prática de atos que ameacem a estabilidade, segurança ou integridade dos servidores e outros usuários;",
      "d) Inatividade prolongada da conta por período superior a 360 (trezentos e sessenta) dias consecutivos.",
      "11.3. O Usuário poderá rescindir sua utilização a qualquer tempo, bastando realizar o logout, cessar o acesso e, se desejar, solicitar a exclusão de seus dados nos termos da nossa Política de Privacidade."
    ]
  },
  {
    id: "tos-12",
    title: "12. LEGISLAÇÃO APLICÁVEL, FORO DE ELEIÇÃO E DISPOSIÇÕES FINAIS",
    content: [
      "12.1. Estes Termos de Serviço são regidos, interpretados e executados segundo as leis vigentes na República Federativa do Brasil, em especial o Código Civil Brasileiro (Lei nº 10.406/2002), o Marco Civil da Internet (Lei nº 12.965/2014) e a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018).",
      "12.2. Qualquer disputa, controvérsia ou litígio decorrente destes Termos que não possa ser dirimido amigavelmente entre as partes será submetido preferencialmente ao Foro da Comarca da Capital do Estado de São Paulo ou ao domicílio do Usuário consumidor conforme faculta o Código de Defesa do Consumidor.",
      "12.3. Se qualquer disposição destes Termos for considerada inválida, nula ou inexequível por um tribunal competente, as demais cláusulas permanecerão em pleno vigor e efeito legal.",
      "12.4. A omissão ou tolerância do Kairo AI em exigir o estrito cumprimento de qualquer dever previsto nestes Termos não constituirá novação ou renúncia contratual, permanecendo as prerrogativas intactas para exercício a qualquer tempo.",
      "12.5. Para esclarecimento de dúvidas sobre este documento, entre em contato através de nossa Central de Atendimento e Suporte Legal: suporte@kairo.ai."
    ]
  }
];

export const PRIVACY_POLICY: LegalSection[] = [
  {
    id: "priv-1",
    title: "1. DECLARAÇÃO DE PRIVACIDADE E COMPROMISSO COM A PROTEÇÃO DE DADOS",
    content: [
      "1.1. Esta Política de Privacidade (\"Política\") descreve detalhadamente como o Kairo AI (\"Kairo\", \"Nós\") coleta, processa, utiliza, armazena, compartilha e protege as informações pessoais dos usuários ao utilizarem nossa plataforma, em estrita conformidade com a Lei Geral de Proteção de Dados Pessoais do Brasil (LGPD, Lei nº 13.709/2018), o Regulamento Geral de Proteção de Dados da União Europeia (GDPR, Reg. 2016/679) e o Marco Civil da Internet (Lei nº 12.965/2014).",
      "1.2. A privacidade dos nossos usuários e o sigilo de suas conversas e personas constituem valores inegociáveis de nossa arquitetura. Desenvolvemos o Kairo AI sob os princípios do Privacy by Design e Privacy by Default, minimizando a coleta de dados estritamente ao necessário para a execução dos serviços de IA solicitados.",
      "1.3. Ao utilizar o Kairo AI e autenticar-se na Plataforma, Você expressa consentimento livre, informado e inequívoco para o tratamento de seus dados de acordo com os termos desta Política."
    ]
  },
  {
    id: "priv-2",
    title: "2. DADOS COLETADOS E FORMAS DE OBTENÇÃO",
    content: [
      "2.1. Dados Coletados na Autenticação com o Google (Single Sign-On):",
      "a) Nome e Sobrenome fornecidos pelo perfil público da Conta Google;",
      "b) Endereço de e-mail institucional ou pessoal verificado;",
      "c) Identificador numérico único de usuário fornecido pelo protocolo OAuth 2.0 (Google Subject ID);",
      "d) URL da foto de perfil / avatar do Google (quando disponibilizada publicamente por Você).",
      "2.2. Dados Criados e Fornecidos Diretamente pelo Usuário (Personas e Conteúdo):",
      "a) Personas Criados pelo Usuário: nomes dos personagens cadastrados, idade declarada, gênero narrativo, biografia/personalidade e fotos/avatares atribuídos pelo Usuário;",
      "b) Mensagens e Prompts de Conversa: o conteúdo textual dos diálogos enviados nas sessões de bate-papo com o assistente;",
      "c) Projetos e Artefatos: títulos, notas de projetos e blocos de código ou documentos salvos localmente.",
      "2.3. Dados Coletados Automaticamente pela Infraestrutura Web:",
      "a) Registros de Conexão: endereço de Protocolo de Internet (IP), data e hora de cada requisição (em estrito cumprimento ao artigo 15 do Marco Civil da Internet);",
      "b) Informações de Hardware e Navegação: tipo e versão do navegador, sistema operacional, preferências de idioma e resolução de tela;",
      "c) Dados de Telemetria de Desempenho: tempos de resposta dos modelos de IA, logs anônimos de erro de renderização e integridade de conexão.",
      "2.4. Dados Financeiros: O Kairo AI NÃO armazena nem processa diretamente números de cartão de crédito, códigos de segurança (CVV) ou dados bancários em seus servidores. Transações comerciais, quando existentes, são executadas por gateways de pagamento certificados PCI-DSS independentes."
    ]
  },
  {
    id: "priv-3",
    title: "3. BASES LEGAIS E FINALIDADES DO TRATAMENTO DE DADOS",
    content: [
      "3.1. Todo e qualquer tratamento de dados pessoais realizado pelo Kairo AI fundamenta-se estritamente nas hipóteses autorizativas do artigo 7º da LGPD:",
      "a) Execução de Contrato (Art. 7º, V): para autenticar o Usuário, prover o serviço de bate-papo, carregar os Personas selecionados e entregar as respostas geradas pela IA;",
      "b) Cumprimento de Obrigação Legal ou Regulatória (Art. 7º, II): para manutenção dos registros de conexão a aplicações de internet pelo prazo legal de 6 (seis) meses em consonância com a Lei nº 12.965/2014;",
      "c) Consentimento Expresso do Titular (Art. 7º, I): para personalização das experiências do Usuário, notificações de sistema e ativação de personas narrativos;",
      "d) Legítimo Interesse do Controlador (Art. 7º, IX): para prevenção a fraudes cibernéticas, segurança cibernética, correção de falhas e garantia da estabilidade dos servidores.",
      "3.2. NÃO UTILIZAÇÃO PARA TREINAMENTO PÚBLICO NÃO AUTORIZADO: O Kairo AI compromete-se formalmente a NÃO vender, ceder ou fornecer suas conversas privadas a empresas terceiras para treinamento de modelos públicos de inteligência artificial de acesso aberto."
    ]
  },
  {
    id: "priv-4",
    title: "4. ARMAZENAMENTO LOCAL, CRIPTOGRAFIA E SEGURANÇA DA INFORMAÇÃO",
    content: [
      "4.1. Filosofia de Armazenamento Local-First: Para máxima privacidade e autonomia, os dados de conversas, personas criados, histórico e preferências de interface são prioritariamente persistidos no armazenamento local criptografado do seu próprio navegador (LocalStorage / IndexedDB).",
      "4.2. Segurança em Trânsito (TLS/SSL): Todo o tráfego de dados entre o seu dispositivo e os servidores do Kairo AI é protegido por criptografia de ponta a ponta com certificados TLS 1.3 de alta intensidade (HTTPS com algoritmo AES-256 bits).",
      "4.3. Chaves de API de Terceiros: Caso o Usuário insira chaves de API próprias (como Groq, OpenAI ou Claude), tais chaves permanecem armazenadas no escopo do seu navegador e são transmitidas diretamente aos endpoints de inteligência artificial por canal seguro de alta criptografia, sendo inacessíveis a outros usuários.",
      "4.4. Monitoramento Contínuo: Empregamos firewalls de aplicação web (WAF), mecanismos anti-DDoS e auditorias de vulnerabilidade para prevenir acessos maliciosos, sequestro de sessões ou vazamento de dados."
    ]
  },
  {
    id: "priv-5",
    title: "5. COMPARTILHAMENTO DE DADOS COM TERCEIROS E PROCESSADORES",
    content: [
      "5.1. O Kairo AI NÃO VENDE nem aluga dados pessoais de seus usuários sob nenhuma circunstância.",
      "5.2. O compartilhamento de dados ocorre de forma estrita e indispensável exclusivamente com:",
      "a) Google LLC: unicamente para viabilizar a autenticação do usuário através do protocolo OAuth 2.0;",
      "b) Provedores de Computação em Nuvem e Infraestrutura (ex.: Google Cloud Platform, Vercel, Cloudflare): para hospedagem de servidores web, roteamento e mitigação de ataques cibernéticos;",
      "c) Provedores de Modelos de IA (conforme solicitado pelo Usuário na sessão de chat): o texto das mensagens enviadas é transmitido ao modelo neural de IA selecionado para gerar a resposta, de acordo com as políticas rígidas de confidencialidade de API de cada fornecedor;",
      "d) Autoridades Públicas e Judiciais: exclusivamente mediante ordem judicial formal fundamentada ou requisição expressa das autoridades competentes nos termos da lei brasileira."
    ]
  },
  {
    id: "priv-6",
    title: "6. DIREITOS DO TITULAR DOS DADOS SEGUNDO A LGPD",
    content: [
      "6.1. Em conformidade com o artigo 18 da Lei Geral de Proteção de Dados (LGPD), o Usuário, na qualidade de Titular de seus dados pessoais, possui os seguintes direitos inalienáveis, exercíveis a qualquer momento:",
      "a) Confirmação da existência de tratamento e acesso aos dados;",
      "b) Correção de dados incompletos, inexatos ou desatualizados (incluindo alteração imediata de Personas e dados de perfil);",
      "c) Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a lei;",
      "d) Portabilidade dos dados a outro fornecedor de serviço, mediante requisição expressa e observados os segredos comerciais;",
      "e) Eliminação completa e definitiva dos dados pessoais tratados com base em consentimento;",
      "f) Informação sobre as entidades públicas e privadas com as quais o controlador realizou uso compartilhado de dados;",
      "g) Informação sobre a possibilidade de não fornecer consentimento e sobre as consequências da negativa;",
      "h) Revogação do consentimento concedido de forma simples, gratuita e facilitada.",
      "6.2. Para exercer quaisquer destes direitos ou solicitar a exclusão total de sua conta e registros, o Usuário pode acionar diretamente nosso canal de atendimento de proteção de dados: dpo@kairo.ai."
    ]
  },
  {
    id: "priv-7",
    title: "7. RETENÇÃO E EXCLUSÃO DEFINITIVA DE DADOS",
    content: [
      "7.1. Os dados de navegação e histórico do Kairo AI permanecem sob seu total controle. Ao utilizar o botão \"Limpar dados\" ou excluir conversas e personas na interface, os registros correspondentes são imediatamente eliminados do armazenamento do seu navegador.",
      "7.2. Os registros de acesso (IPs, data e hora) exigidos pelo Marco Civil da Internet são conservados sob estrito sigilo pelo prazo compulsório de 6 (seis) meses, findo o qual são automaticamente expurgados e destruídos.",
      "7.3. Em caso de revogação de consentimento ou exclusão de conta, cessamos imediatamente o tratamento de dados ativos, ressalvadas as hipóteses legais de guarda estrita para cumprimento de obrigação legal ou defesa em processo judicial."
    ]
  },
  {
    id: "priv-8",
    title: "8. PRIVACIDADE DE MENORES E DADOS SENSÍVEIS",
    content: [
      "8.1. O Kairo AI não direciona seus serviços intencionalmente a crianças menores de 13 anos. Caso tomemos ciência de que informações de crianças foram inadvertidamente coletadas sem o consentimento dos pais, tomaremos providências imediatas para eliminar tais dados de nossos registros.",
      "8.2. Não coletamos intencionalmente dados sensíveis de saúde, biometria genética, convicção religiosa ou filiação partidária, salvo aquilo que o próprio Usuário voluntariamente optar por incluir nos prompts de conversação com o assistente inteligente."
    ]
  },
  {
    id: "priv-9",
    title: "9. TRANSFERÊNCIA INTERNACIONAL DE DADOS",
    content: [
      "9.1. Como os servidores de nuvem de ponta e os clusters de processamento de inteligência artificial podem estar situados em centros de dados seguros no exterior (notadamente nos Estados Unidos e União Europeia), a utilização do Kairo AI pode envolver a transferência internacional de dados.",
      "9.2. Todas as transferências internacionais de dados atendem rigorosamente aos padrões dos artigos 33 e seguintes da LGPD, mediante cláusulas contratuais padrão, normas corporativas globais vinculantes e compromissos formais de segurança da informação."
    ]
  },
  {
    id: "priv-10",
    title: "10. ATUALIZAÇÕES DA POLÍTICA DE PRIVACIDADE E CONTATO DO DPO",
    content: [
      "10.1. Esta Política de Privacidade poderá ser alterada periodicamente para refletir avanços tecnológicos, novas funcionalidades ou atualizações regulatórias legislativas.",
      "10.2. Qualquer alteração substancial será informada com destaque na interface do Kairo AI ou por notificação ao e-mail cadastrado.",
      "10.3. Para quaisquer dúvidas, requisições sobre a LGPD ou solicitações de titulares, nosso Encarregado pelo Tratamento de Dados Pessoais (DPO) pode ser contatado diretamente através do e-mail: dpo@kairo.ai ou privacidade@kairo.ai."
    ]
  }
];
