Release 0.0.2: treino invisível, carreira policial, crime e prisão
Você está numa sessão nova, sem o histórico das conversas anteriores. A release 0.0.1 já foi feita. Esta sessão ajusta o treino e adiciona dois grandes sistemas: a carreira policial (Polícia Militar e Polícia Civil) e o mundo do crime (delitos, facções, prisão). No fim, fecha a release 0.0.2.
Regras da sessão (economia de contexto)

1. Orientação enxuta: leia o CLAUDE.md, o GDD.md, o ASSETS.md, o `docs/HANDOFF.md` e o `git log --oneline -30`. Para entender o código, use o subagente Explore em vez de abrir dezenas de arquivos. Leia por inteiro só o que for alterar.
2. Confirme o ponto de partida: antes de mudar qualquer coisa, me diga em poucas linhas o estado da 0.0.1 (o que está pronto, pendências do CHANGELOG, se os testes passam).
3. Arquivo de progresso: crie `docs/release-0.0.2/PROGRESS.md` com as fases abaixo como checklist e mantenha atualizado.
4. Commits por fase na branch `release/0.0.2`. Ao fim de cada fase: `tsc --noEmit`, testes da área, commit e PROGRESS.md atualizado.
5. Se o contexto estiver acabando: pare num ponto limpo, atualize o PROGRESS.md com o próximo passo exato e me diga para abrir uma sessão nova com: "Continue a release 0.0.2 a partir do docs/release-0.0.2/PROGRESS.md".
6. Ao rodar testes, build ou `npm run sim`, mostre só o resumo e as falhas.
7. Siga todas as regras de arquitetura do CLAUDE.md. Toda mudança no estado exige migração de save.

Regras de conteúdo (obrigatórias para polícia, crime e prisão)

* Tudo fictício: facções, unidades especiais, operações, presídios e pessoas. Os nomes não podem coincidir nem lembrar de perto organizações reais (veja o teste de nomes proibidos).
* Crime é mecânica de jogo, não manual: delitos aparecem como escolhas com chance, risco e consequência. Nada de instruções, técnicas, métodos, receitas ou detalhes operacionais do mundo real (como cometer, como fabricar, como burlar segurança).
* Violência não gráfica: troca de tiro, brigas e mortes são descritas de forma curta, no tom do BitLife, sem detalhes sangrentos.
* Prisão sem violência sexual: nenhum evento de prisão envolve violência sexual, nem como insinuação.
* Consequências reais e equilíbrio: o crime pode dar dinheiro, mas sempre com risco crescente de prisão, ferimento, morte e efeitos duradouros na família, na saúde, na felicidade e nas oportunidades. A polícia também tem riscos e dilemas (corrupção, uso da força, corregedoria). Nenhum dos dois lados é glamourizado.
* Menores de idade: o personagem só pode cometer delitos graves e entrar em facção a partir dos 18. Entre 12 e 17 existem apenas infrações leves (pichação, furto pequeno, briga na escola), com consequências socioeducativas fictícias e simplificadas (advertência, serviço comunitário, internação curta). Nenhum evento coloca crianças em atividade criminosa organizada.

Melhorias
1. Treino invisível

* Remova da HUD e de todas as telas qualquer contador de treino ("Treinos: 7/10" e semelhantes).
* O limite de 10 sessões por ano continua no engine, assim como o desconto por emprego e faculdade.
* Quando o personagem passa do limite, a ação de treino continua disponível, mas não dá ganho e mostra um aviso no lugar do resultado: "Você treinou demais este ano. Seu corpo precisa descansar para evoluir." (varie o texto). A partir da 2ª tentativa extra, há um pequeno risco de lesão por excesso.
* Se o limite estiver reduzido pelo emprego, o aviso diz isso de forma natural ("Com seu trabalho, não sobra tempo para treinar mais este ano").
* Atualize os textos e testes que citavam o contador.

2. Carreira policial
Duas carreiras separadas, chamadas apenas Polícia Militar e Polícia Civil, sem sigla nem nome de estado. Elas aparecem em Ocupação → Carreiras numa categoria "Segurança pública".
Ingresso por concurso (em dados, em `src/content/careers/police/`):

* Idade de 18 a 30 anos na inscrição; requisitos de escolaridade definidos em dados por cargo (por exemplo, ensino médio ou superior para soldado e diploma de Direito para delegado), fáceis de ajustar.
* Etapas: prova (inteligência + estudo + sorte), teste de aptidão física (Capacidade atlética), exame de saúde, avaliação psicológica (felicidade e histórico de eventos) e investigação social (ficha criminal limpa é obrigatória; envolvimento com facção reprova).
* Aprovado: curso de formação na academia de polícia (1 ano) com eventos próprios, e depois estágio probatório.
* Novo atributo oculto Tiro (0–100), treinado na academia de polícia e na atividade "Treinar no estande" (conta nas 10 sessões).

Polícia Militar (patrulhamento e ação ostensiva)

* Praças: Soldado → Cabo → Sargento → Subtenente.
* Oficiais: curso de formação de oficiais (exige superior e novo concurso interno) → Tenente → Capitão → Major → Tenente-coronel → Coronel.
* Promoção por tempo, mérito (ocorrências bem resolvidas), cursos e eventos.

Polícia Civil (investigação)

* Investigador e escrivão (classes por tempo e mérito) e delegado (exige Direito; classes até o topo da carreira).
* Delegado chefia investigações e decide os rumos dos inquéritos.

Força especial

* Cada polícia tem uma unidade tática de elite com nome fictício (por exemplo, para a PM algo como "Batalhão de Intervenção Tática" e para a Civil um "Grupo de Resposta Especial" — crie os seus, desde que não coincidam com unidades reais).
* Ingresso por curso de seleção muito difícil: exige anos de serviço, Capacidade atlética e Tiro altos, saúde boa e sorte. Há uma chance alta de desistência ou reprovação, com eventos durante o curso.
* Na unidade: missões mais perigosas e prestigiadas, mais reputação, mais risco de ferimento e morte, e um bônus de salário.

Ações e eventos da carreira (pelo menos 25 eventos em `src/content/events/police/`)

* Ações do ano: patrulhar ou trabalhar com afinco (+chance de promoção), fazer cursos, treinar no estande, pedir transferência e pedir exoneração.
* Abordagem (PM): escolhas como seguir o protocolo, revistar, liberar, pedir apoio ou usar força. Grappling e trocação ajudam a imobilizar sem ferir. Consequências: prisão do suspeito, reclamação, corregedoria ou elogio.
* Ocorrências (PM): assalto em andamento, briga em bar (pode reconhecer um lutador), violência doméstica, acidente, perseguição.
* Troca de tiro: resolvida por Tiro, Capacidade atlética, tática (escolha do jogador: avançar, se abrigar, negociar, recuar) e sorte. Resultados: suspeito preso, fuga, colega ferido, personagem ferido (usa o sistema de lesões) ou morte do personagem (rara, mais comum na força especial). Texto não gráfico.
* Investigação (Civil): cadeia de 3 a 5 eventos encadeados por caso (furto de carga, homicídio, desvio de dinheiro, facção), em que o jogador escolhe pistas, interroga testemunhas, pede mandado e decide quando fazer a operação. Boas escolhas e sorte levam ao caso resolvido; más escolhas levam a um caso arquivado ou à prisão do suspeito errado.
* Dilemas: oferta de propina, colega corrupto, pressão política. Aceitar dá dinheiro, mas abre o risco de corregedoria, exoneração e prisão.
* Outros: homenagem, ser reconhecido na rua por um criminoso, ameaça à família, plantão no Natal, colega morto em serviço (impacto na felicidade).
* Os NPCs criminosos presos pelo personagem podem reaparecer depois (vingança, reencontro na rua, delação).

3. Crime e justiça
Delitos (em `src/content/crime/`), acessados por Atividades → Crime, com chance de sucesso, ganho e risco:

* Leves (12+): pichação, furto em loja, briga de rua, dano a patrimônio.
* Médios (18+): furto de carro, receptação, estelionato simples, agressão.
* Graves (18+): assalto a pedestre, assalto a comércio, assalto a joalheria, assalto a banco, tráfico de drogas e sequestro.
* Delitos graves são planejados em etapas de escolha abstratas (montar equipe com NPCs, escolher o alvo, escolher o momento, decidir na hora se segue ou aborta), sem nenhum detalhe técnico real. O resultado sai do RNG com sorte, Capacidade atlética, inteligência, reputação no crime e qualidade da equipe.
* Nível de procurado (oculto, com pistas: "Você sente que está sendo observado"): sobe com cada delito e com testemunhas; desce com o tempo. Aumenta a chance de investigação e prisão.
* Reputação no crime (oculta): abre crimes maiores e convites de facção.
* Dinheiro do crime fica como "dinheiro sujo": usar muito de uma vez gera suspeita (evento), e é possível lavar por meio de um empreendimento do Mercado, com risco.

Tráfico de drogas (18+)

* Tratado como "negócio" abstrato dentro de uma facção ou por conta própria: escolher o nível de envolvimento (pequeno, médio, grande), com lucro anual e risco anual de apreensão, prisão, conflito com rivais e morte.
* Sem nomes de substâncias específicas além de "drogas", e sem nenhum detalhe de produção, preparo ou logística real.

Facções criminosas fictícias (pelo menos 4, em `src/content/crime/factions/`)

* Nomes, siglas, cores e símbolos inventados, sem lembrar facções reais. Cada uma com território (UFs e cidades), tamanho, rivalidades e "regras internas".
* Entrada só por convite (exige reputação no crime ou conhecer um membro), a partir dos 18. Hierarquia: membro → soldado → gerente → liderança regional → cúpula.
* Benefícios: crimes maiores, proteção na prisão e dinheiro. Custos: obrigações (cumprir "missões"), guerras com facções rivais, dívidas internas e o risco de morte por traição ou desobediência. Sair da facção é muito difícil e perigoso (evento com escolhas).
* NPCs da família e amigos reagem (afastamento, medo, alguns entram junto).

Prisão e processo

* Ser pego leva a: abordagem ou flagrante → delegacia → audiência → processo. Antes do julgamento: fiança (quando cabível), advogado (contratar um NPC advogado — a carreira de Direito ganha função — ou defensor público) e chance de responder em liberdade.
* Sentença simplificada por categoria de crime (faixas de anos em dados, inspiradas nas penas brasileiras, mas simplificadas e fictícias), agravada por reincidência e atenuada por bom advogado, confissão e sorte.
* Regimes fechado, semiaberto e aberto, com progressão por tempo e bom comportamento, livramento condicional e remição (trabalhar ou estudar na prisão reduz a pena).
* Ficha criminal permanente: bloqueia concursos públicos e empregos que exigem ficha limpa, reduz a chance em outros empregos e aparece em eventos.

Vida na prisão (pelo menos 20 eventos em `src/content/events/prison/`)

* Ações do ano preso: trabalhar, estudar (supletivo e curso à distância), treinar no pátio (limite de sessões menor), conversar com detentos, receber visitas da família ou do parceiro(a) (o afeto pesa), tentar se manter fora de confusão.
* Eventos: briga no pátio (o lutador se destaca e ganha respeito), recrutamento por facção (aceitar dá proteção e obrigações), dívida com outro preso, revista na cela, rebelião (escolher lado ou se esconder), transferência, tentativa de fuga (muito arriscada; aumenta a pena se falhar), visita que não vem, mentor que ajuda a mudar de vida.
* Sair da prisão: evento de reintegração (dificuldade de emprego, família, convite para voltar ao crime ou para recomeçar). Programas de ressocialização fictícios ajudam.

Cruzamento entre os sistemas

* Um policial pode prender NPCs ligados ao personagem (família, ex-amigos) e enfrentar dilemas.
* Um personagem com ficha criminal não pode ser policial; um policial pode ser preso (corrupção, excesso de força) e vai para uma ala separada, com eventos próprios.
* Lutadores: brigas de rua e na prisão afetam a reputação de lutador; ser preso cancela contratos e patrocínios; um ex-presidiário pode recomeçar na luta (evento de redenção).

4. Interface

* Ocupação → Carreiras ganha a categoria "Segurança pública" com Polícia Militar e Polícia Civil, seguindo o mesmo padrão de cartões e escada de progressão.
* Uma tela central da carreira policial, no mesmo estilo da tela central da luta: cargo, unidade, tempo de serviço, avaliação em palavras, ocorrências marcantes e um cartão "Próximo passo".
* Atividades → Crime (só a partir dos 12, com os graves a partir dos 18), com cada delito mostrando o risco em palavras ("Risco: alto"). Uma tela "Ficha" mostra a ficha criminal e a situação na justiça.
* Durante a prisão, a tela principal mostra um banner "Preso — regime fechado, faltam X anos" e o menu de Atividades é trocado pelas ações da prisão.
* Avatar: fardas da PM e da Civil (colete e distintivo), farda da força especial, uniforme de presidiário e o personagem algemado no evento de prisão. Use a mesma direção de arte e o sistema de roupas baseado na silhueta.
* Ícones em pixel art para cada delito, para as fardas e para as facções (símbolos inventados).

Testes (Vitest)

* Treino: nenhum contador de treino aparece na UI (teste de componente); acima do limite, ganho zero e aviso certo; risco de lesão por excesso a partir da 2ª tentativa extra.
* Concurso: idade 18–30, escolaridade por cargo, ficha criminal reprova, TAF depende da Capacidade atlética; aprovação e formação.
* Promoções da PM e da Civil; delegado exige Direito; curso da força especial com taxa de aprovação dentro da faixa definida (`npm run sim`).
* Troca de tiro e investigação: determinismo pelo seed; a sorte inclina sem decidir sozinha.
* Delitos: idade mínima por categoria; nível de procurado sobe e desce; dinheiro sujo gera suspeita.
* Facção: só entra com convite e 18+; sair é possível, mas arriscado; rivalidades geram eventos.
* Justiça: faixas de pena; agravantes e atenuantes; progressão de regime; remição reduz a pena; ficha criminal bloqueia concursos e empregos que exigem ficha limpa.
* Prisão: ações trocadas enquanto preso; soltura no ano certo; fuga falha aumenta a pena.
* Nomes proibidos: um teste varre todo o conteúdo novo e falha se encontrar nomes ou siglas de facções e unidades reais. Inclua, no mínimo: PCC, Primeiro Comando da Capital, CV, Comando Vermelho, TCP, Terceiro Comando Puro, ADA, Amigos dos Amigos, FDN, Família do Norte, BDM, Bonde do Maluco, GDE, Guardiões do Estado, Sindicato do Crime, BOPE, ROTA, GATE, COE, CORE, TIGRE, GOE, COT, Choque. Também falha se algum texto citar estado ou sigla estadual junto de "Polícia Militar" ou "Polícia Civil".
* Menores: em 1000 vidas simuladas, nenhum personagem com menos de 18 anos comete delito grave, entra em facção ou trafica.
* Migração de save; validação de schema e ids de todo o conteúdo novo.

Balanceamento
Estenda o `npm run sim` com: % que vira policial, idade média de entrada, % que entra na força especial, mortes em serviço; % que comete crimes, % presos, pena média, reincidência, % em facção, expectativa de vida no crime e renda média do crime contra a de um emprego comum. Ajuste para que:

* o crime renda mais no curto prazo, mas quase sempre termine mal no longo prazo;
* a carreira policial seja estável, com picos de risco;
* a força especial seja rara. Registre no GDD.

Fases (nesta ordem, uma por commit)

0. Plano: use o modo de planejamento e me mostre o plano, com a lista de nomes fictícios propostos (facções, unidades especiais, presídios) e um esboço em texto das telas novas. Espere minha aprovação.
1. Treino invisível (Melhoria 1).
2. Base da carreira policial: concurso, formação, atributo Tiro, cargos e promoções.
3. Eventos da PM (abordagem, ocorrências, troca de tiro) e da Civil (investigações encadeadas), dilemas e força especial.
4. Delitos, nível de procurado, reputação no crime e dinheiro sujo.
5. Facções e tráfico.
6. Justiça, processo, sentença, ficha criminal.
7. Prisão e reintegração.
8. Cruzamentos entre polícia, crime, luta e relacionamentos.
9. Interface, fardas, uniformes e ícones.
10. Balanceamento com o `npm run sim`.
11. Documentação e release.

Documentação

* GDD.md: treino invisível, carreira policial (PM, Civil, força especial), crime, facções, justiça e prisão, regras de conteúdo e balanceamento.
* CLAUDE.md: regras de conteúdo desta release (tudo fictício, sem manual, violência não gráfica, menores), o teste de nomes proibidos e como adicionar cargo, evento policial, delito, facção e evento de prisão.

Checklist da release 0.0.2

1. `tsc --noEmit`, lint e todos os testes sem erros; `npm run build` sem avisos relevantes; `npm run sim` com resultados no GDD.
2. Tamanho do bundle registrado no CHANGELOG.
3. Saves da 0.0.1 (crie uma fixture) migram sem erro.
4. Teste manual no navegador, em 375×667 e 414×896, com o console sem erros:
   * treinar além do limite mostra o aviso e nenhum contador aparece;
   * passar no concurso da PM, se formar e subir de patente; viver uma abordagem e uma troca de tiro;
   * passar no concurso da Civil e resolver uma investigação de ponta a ponta;
   * tentar o curso da força especial;
   * em outra vida: cometer um delito leve na adolescência, crimes graves depois dos 18, entrar numa facção, ser preso, viver a prisão, progredir de regime e sair;
   * confirmar que a ficha criminal bloqueia o concurso.
5. Capturas de tela da carreira policial, de uma troca de tiro, de uma investigação, do menu de crime, da tela de prisão e das fardas no avatar, em `docs/release-0.0.2/screenshots/`.
6. `version` 0.0.2 no package.json e em Configurações.
7. CHANGELOG.md com a seção 0.0.2, "Próximos passos" e problemas conhecidos.
8. Atualize o PROGRESS.md e o `docs/HANDOFF.md`, faça o commit final, crie a tag `v0.0.2` localmente e me mostre o resumo. Não faça push, merge na main ou deploy sem me perguntar.