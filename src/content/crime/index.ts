/**
 * Delitos (release 0.0.2). Crime é MECÂNICA de jogo: cada delito é uma escolha com chance, ganho e risco, descrito
 * em uma frase, sem nenhum método, técnica ou detalhe operacional real. Leves a partir dos 12 (consequências
 * socioeducativas simplificadas); médios e graves só a partir dos 18. Os graves são planejados em etapas abstratas.
 */
import type { CrimeContent, CrimeDef } from '../../engine';
import { FACTION_RANKS, FACTIONS } from './factions';
import { BAILABLE, FACILITIES, SENTENCES } from './sentences';

export const CRIMES: readonly CrimeDef[] = [
  // --- leves (12+) ---
  { id: 'pichacao', label: 'Pichação', emoji: '🖌️', tier: 'leve', minAge: 12, baseSuccess: 0.8, gain: [0, 0], risk: { caught: 0.35, injury: 0.02, death: 0 }, wantedGain: 3, repGain: 1, text: { ok: 'Você deixou sua marca num muro do bairro e saiu sem ser vist{o/a}.', fail: 'Um vizinho viu tudo.' } },
  { id: 'furto_loja', label: 'Furto em loja', emoji: '🛍️', tier: 'leve', minAge: 12, baseSuccess: 0.65, gain: [40, 300], risk: { caught: 0.5, injury: 0, death: 0 }, wantedGain: 5, repGain: 2, text: { ok: 'Você saiu da loja com algo que não pagou. O coração ainda está acelerado.', fail: 'O segurança te parou na porta.' } },
  { id: 'briga_rua', label: 'Briga de rua', emoji: '👊', tier: 'leve', minAge: 12, baseSuccess: 0.55, gain: [0, 0], risk: { caught: 0.3, injury: 0.35, death: 0.002 }, wantedGain: 4, repGain: 3, text: { ok: 'Você levou a melhor na briga e a turma toda ficou sabendo.', fail: 'A briga terminou mal para você.' } },
  { id: 'dano_patrimonio', label: 'Dano a patrimônio', emoji: '🪨', tier: 'leve', minAge: 12, baseSuccess: 0.7, gain: [0, 0], risk: { caught: 0.4, injury: 0.03, death: 0 }, wantedGain: 4, repGain: 1, text: { ok: 'Você quebrou o que não devia e ninguém viu quem foi.', fail: 'Uma câmera pegou seu rosto.' } },
  // --- médios (18+) ---
  { id: 'furto_carro', label: 'Furto de carro', emoji: '🚗', tier: 'medio', minAge: 18, baseSuccess: 0.45, gain: [4000, 12000], risk: { caught: 0.5, injury: 0.05, death: 0.003 }, wantedGain: 14, repGain: 6, minCrimeRep: 5, text: { ok: 'O carro sumiu do estacionamento e virou dinheiro num desmanche.', fail: 'O alarme disparou e o dono apareceu.' } },
  { id: 'receptacao', label: 'Receptação', emoji: '📦', tier: 'medio', minAge: 18, baseSuccess: 0.6, gain: [1500, 6000], risk: { caught: 0.35, injury: 0, death: 0 }, wantedGain: 8, repGain: 4, text: { ok: 'Você revendeu mercadoria roubada com um bom lucro.', fail: 'O comprador era um policial disfarçado.' } },
  { id: 'estelionato', label: 'Estelionato', emoji: '📄', tier: 'medio', minAge: 18, baseSuccess: 0.5, gain: [2000, 15000], risk: { caught: 0.45, injury: 0, death: 0 }, wantedGain: 10, repGain: 4, text: { ok: 'Uma história bem contada e a vítima pagou. Ela vai demorar a perceber.', fail: 'A vítima desconfiou e foi direto à delegacia.' } },
  { id: 'agressao', label: 'Agressão', emoji: '🥊', tier: 'medio', minAge: 18, baseSuccess: 0.6, gain: [0, 0], risk: { caught: 0.45, injury: 0.25, death: 0.002 }, wantedGain: 10, repGain: 5, text: { ok: 'Você bateu e foi embora antes de alguém chamar a polícia.', fail: 'Testemunhas chamaram a polícia na hora.' } },
  // --- graves (18+, planejados) ---
  { id: 'assalto_pedestre', label: 'Assalto a pedestre', emoji: '📱', tier: 'grave', minAge: 18, baseSuccess: 0.55, gain: [300, 2500], risk: { caught: 0.45, injury: 0.12, death: 0.006 }, wantedGain: 16, repGain: 6, text: { ok: 'Você levou celular e carteira e sumiu na esquina.', fail: 'A vítima reagiu e gente correu para ajudar.' } },
  { id: 'assalto_comercio', label: 'Assalto a comércio', emoji: '🏪', tier: 'grave', minAge: 18, baseSuccess: 0.45, gain: [3000, 15000], risk: { caught: 0.5, injury: 0.15, death: 0.012 }, wantedGain: 22, repGain: 10, minCrimeRep: 10, plan: true, text: { ok: 'O assalto deu certo e a equipe dividiu o dinheiro.', fail: 'Uma viatura passava na hora.' } },
  { id: 'assalto_joalheria', label: 'Assalto a joalheria', emoji: '💎', tier: 'grave', minAge: 18, baseSuccess: 0.35, gain: [30000, 120000], risk: { caught: 0.55, injury: 0.18, death: 0.02 }, wantedGain: 35, repGain: 15, minCrimeRep: 30, plan: true, text: { ok: 'As joias sumiram em minutos. A notícia saiu no jornal da noite.', fail: 'O alarme silencioso já tinha chamado a polícia.' } },
  { id: 'assalto_banco', label: 'Assalto a banco', emoji: '🏦', tier: 'grave', minAge: 18, baseSuccess: 0.25, gain: [150000, 600000], risk: { caught: 0.65, injury: 0.2, death: 0.04 }, wantedGain: 55, repGain: 25, minCrimeRep: 50, plan: true, text: { ok: 'O maior golpe da sua vida. A cidade inteira fala nisso.', fail: 'A polícia cercou a agência antes da fuga.' } },
  { id: 'sequestro', label: 'Sequestro', emoji: '🚐', tier: 'grave', minAge: 18, baseSuccess: 0.3, gain: [50000, 250000], risk: { caught: 0.65, injury: 0.15, death: 0.03 }, wantedGain: 50, repGain: 20, minCrimeRep: 40, plan: true, text: { ok: 'O resgate foi pago e a vítima foi liberada sem ferimentos.', fail: 'A polícia rastreou a ligação do resgate.' } },
];

export const CRIME: CrimeContent = {
  crimes: CRIMES,
  planEvents: ['crime_plano_equipe', 'crime_plano_alvo', 'crime_plano_momento', 'crime_plano_hora'],
  suspicionEventId: 'crime_suspeita',
  places: { juvenile: 'Centro Socioeducativo Rumo Novo', reentry: 'Programa Portas Abertas' },
  factions: FACTIONS,
  factionRanks: FACTION_RANKS,
  factionEvents: { mission: 'crime_faccao_missao', leave: 'crime_faccao_saida' },
  sentences: SENTENCES,
  bailable: BAILABLE,
  facilities: FACILITIES,
  justiceEvents: { station: 'justica_delegacia', defense: 'justica_defesa', trial: 'justica_julgamento' },
};
