/**
 * Passar tempo com todos os amigos (release 0.0.3): atividades em grupo por idade e eventos de grupo.
 * Os eventos de grupo ficam em `content/events/friends/` (trigger 'followUp', com {pessoa} e {pessoa2}).
 */
import type { FriendsContent } from '../../engine';
import { FRIEND_GROUP_EVENTS } from '../events/friends';

export const FRIENDS: FriendsContent = {
  activities: [
    // criança (6–11): tudo de graça
    { id: 'brincar_rua', label: 'Brincar na rua', emoji: '🏃', minAge: 6, maxAge: 11, cost: 0, happiness: 6, affection: 5, text: 'Você e mais {n} amigos brincaram na rua até a hora de entrar. Pega-pega, esconde-esconde e muita risada.' },
    { id: 'videogame', label: 'Videogame', emoji: '🎮', minAge: 6, maxAge: 11, cost: 0, happiness: 5, affection: 4, text: 'Tarde de videogame com {n} amigos. Todo mundo jurou que ia ganhar a próxima.' },
    { id: 'festa_aniversario', label: 'Festa de aniversário', emoji: '🎂', minAge: 6, maxAge: 11, cost: 0, happiness: 7, affection: 5, text: 'Seus pais fizeram uma festinha e {n} amigos vieram. Teve bolo, brigadeiro e parabéns bem desafinado.' },
    // adolescente (12–17): custos baixos
    { id: 'shopping', label: 'Rolê no shopping', emoji: '🛍️', minAge: 12, maxAge: 17, cost: 60, happiness: 5, affection: 5, text: 'Você e {n} amigos rodaram o shopping, dividiram uma batata frita e não compraram quase nada.' },
    { id: 'praia_teen', label: 'Praia com a turma', emoji: '🏖️', minAge: 12, maxAge: 17, cost: 30, happiness: 6, affection: 6, text: 'Dia de praia com {n} amigos: mergulho, frescobol e protetor esquecido em casa.' },
    { id: 'festa_teen', label: 'Festa da turma', emoji: '🎉', minAge: 12, maxAge: 17, cost: 40, happiness: 7, affection: 6, text: 'Você foi a uma festa com {n} amigos e dançou até seus pais ligarem pela terceira vez.' },
    { id: 'bola', label: 'Jogar bola', emoji: '⚽', minAge: 12, maxAge: 17, cost: 0, happiness: 5, affection: 5, text: 'Pelada na quadra com {n} amigos. Ninguém lembra o placar, mas todo mundo lembra do seu gol.' },
    // adulto (18+)
    { id: 'churrasco', label: 'Churrasco', emoji: '🍖', minAge: 18, maxAge: 120, cost: 150, happiness: 7, affection: 7, text: 'Churrasco com {n} amigos: carne na brasa, pagode no fundo e conversa até tarde.' },
    { id: 'bar', label: 'Barzinho', emoji: '🍻', minAge: 18, maxAge: 120, cost: 120, happiness: 6, affection: 6, text: 'Você e {n} amigos ocuparam a mesa do bar e resolveram todos os problemas do mundo.' },
    { id: 'praia', label: 'Praia', emoji: '🏖️', minAge: 18, maxAge: 120, cost: 100, happiness: 6, affection: 6, text: 'Dia de praia com {n} amigos: guarda-sol, isopor e pé na areia.' },
    { id: 'viagem_curta', label: 'Viagem curta', emoji: '🚗', minAge: 18, maxAge: 120, cost: 900, happiness: 8, affection: 9, text: 'Você e {n} amigos pegaram a estrada num fim de semana prolongado. Voltaram cansados e cheios de histórias.' },
    { id: 'jogo_futebol', label: 'Jogo no estádio', emoji: '🏟️', minAge: 18, maxAge: 120, cost: 180, happiness: 7, affection: 6, text: 'Você foi ao estádio com {n} amigos. Grito, abraço no gol e rouquidão no dia seguinte.' },
    { id: 'treinar_juntos', label: 'Treinar juntos', emoji: '💪', minAge: 18, maxAge: 120, cost: 0, happiness: 4, affection: 5, training: true, text: 'Você treinou com {n} amigos. Um puxou o outro, e ninguém pulou a última série.' },
    { id: 'noite_jogos', label: 'Noite de jogos', emoji: '🎲', minAge: 18, maxAge: 120, cost: 40, happiness: 5, affection: 6, text: 'Noite de jogos de tabuleiro com {n} amigos. Teve acusação de roubo e revanche marcada.' },
  ],
  groupEvents: FRIEND_GROUP_EVENTS.map((e) => e.id),
  groupEventChance: 0.45,
};
