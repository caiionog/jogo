import type { GameEvent } from '../../../engine';

/** Bens, empresas e pessoas pedindo dinheiro. */
export const ASSET_EVENTS: readonly GameEvent[] = [
  {
    id: 'eco_leak',
    conditions: { minAge: 18, economy: { hasAsset: ['imovel'] } },
    weight: 4,
    text: 'Uma infiltração apareceu no seu imóvel: mofo, parede estufada e goteira.',
    choices: [
      { id: 'fix', label: 'Consertar logo (3% do valor)', effects: { economy: { assetDamage: { kind: 'imovel', share: 0.03, label: 'Conserto da infiltração' } } }, resultText: 'Obra feita, problema resolvido.' },
      { id: 'later', label: 'Deixar para depois', effects: { stats: { happiness: -2, health: -1 }, economy: { assetDamage: { kind: 'imovel', share: 0.01, label: 'Remendo improvisado' } } }, resultText: 'O remendo segurou... mais ou menos.' },
    ],
  },
  {
    id: 'eco_car_stolen',
    conditions: { minAge: 18, economy: { hasAsset: ['veiculo'] } },
    weight: 3,
    text: 'Você saiu do treino e seu carro não estava mais na vaga.',
    choices: [
      { id: 'police', label: 'Registrar o boletim de ocorrência', effects: { stats: { happiness: -4 }, economy: { vehicleTheft: true } }, resultText: 'Agora é com o seguro (se você tiver um).' },
    ],
  },
  {
    id: 'eco_traffic_fine',
    conditions: { minAge: 18, economy: { hasAsset: ['veiculo'] } },
    weight: 4,
    text: 'Chegou uma multa: radar de velocidade na volta do treino.',
    choices: [
      { id: 'pay', label: 'Pagar a multa (R$ 1.500)', effects: { economy: { post: { cat: 'multas', amount: -1500, label: 'Multa de trânsito' } } }, resultText: 'Pago. Pé mais leve da próxima vez.' },
      {
        id: 'appeal',
        label: 'Recorrer (R$ 300 de taxa)',
        effects: { economy: { post: { cat: 'multas', amount: -300, label: 'Recurso de multa' } } },
        resultText: 'O recurso foi aceito!',
        risk: { chance: 0.6, effects: { economy: { post: { cat: 'multas', amount: -1800, label: 'Multa + recurso negado' } } }, resultText: 'Recurso negado: pagou a multa e a taxa.' },
      },
    ],
  },
  {
    id: 'eco_car_accident',
    conditions: { minAge: 18, economy: { hasAsset: ['veiculo'] } },
    weight: 3,
    text: 'Uma batida no trânsito: ninguém se feriu gravemente, mas o carro ficou amassado.',
    choices: [
      { id: 'fix', label: 'Consertar (15% do valor do carro)', effects: { stats: { health: -3 }, economy: { assetDamage: { kind: 'veiculo', share: 0.15, label: 'Conserto do carro' } } }, resultText: 'O carro voltou da oficina como novo.' },
    ],
  },
  {
    id: 'eco_rent_default',
    conditions: { minAge: 18, economy: { rentingOut: true } },
    weight: 4,
    text: 'Seu inquilino parou de pagar o aluguel há três meses.',
    choices: [
      { id: 'evict', label: 'Entrar com despejo (R$ 4.000)', effects: { economy: { post: { cat: 'eventos', amount: -4000, label: 'Processo de despejo' } } }, resultText: 'Demorou, mas o imóvel foi liberado.' },
      { id: 'deal', label: 'Negociar um desconto', effects: { economy: { post: { cat: 'aluguel_recebido', amount: -2000, label: 'Desconto no aluguel' } } }, resultText: 'Acordo feito: ele voltou a pagar.' },
    ],
  },
  {
    id: 'eco_gym_buyout',
    conditions: { minAge: 20, economy: { businessDefs: ['academia'] } },
    weight: 4,
    text: 'Uma rede de academias quer comprar a sua academia e manter o seu nome na fachada.',
    choices: [
      { id: 'sell', label: 'Vender (30% acima do valor)', effects: { economy: { sellBusinessOffer: { defId: 'academia', multiple: 1.3 } } }, resultText: 'Negócio fechado. Dinheiro no bolso, saudade no peito.' },
      { id: 'keep', label: 'Não está à venda', effects: { stats: { happiness: 2 } }, resultText: 'A academia é o seu legado.' },
    ],
  },
  {
    id: 'eco_business_buyout',
    conditions: { minAge: 20, economy: { ownsBusiness: true } },
    weight: 3,
    text: 'Um investidor quer comprar a sua empresa.',
    choices: [
      { id: 'sell', label: 'Vender (20% acima do valor)', effects: { economy: { sellBusinessOffer: { multiple: 1.2 } } }, resultText: 'Venda concluída.' },
      { id: 'keep', label: 'Recusar a proposta', effects: {}, resultText: 'Você acredita no seu negócio.' },
    ],
  },
  {
    id: 'eco_sibling_partner',
    conditions: { minAge: 22, economy: { ownsBusiness: true }, relationship: { types: ['irmao'], personAge: { min: 20 } } },
    weight: 3,
    once: true,
    text: '{pessoa} quer entrar de sócio(a) na sua empresa e investir R$ 40.000.',
    choices: [
      { id: 'yes', label: 'Aceitar o(a) sócio(a)', effects: { economy: { post: { cat: 'empresa', amount: 40000, label: 'Aporte do sócio' } }, social: { affection: 10 } }, resultText: 'Negócio em família!' },
      { id: 'no', label: 'Prefiro não misturar família e negócios', effects: { social: { affection: -6 } }, resultText: '{pessoa} ficou chateado(a).' },
    ],
  },
  {
    id: 'eco_friend_loan',
    conditions: { minAge: 18, economy: { money: { min: 3000 } }, relationship: { types: ['amigo', 'colega_treino', 'irmao'], affection: { min: 40 } } },
    weight: 4,
    text: '{pessoa} está numa situação difícil e pede R$ 3.000 emprestados.',
    choices: [
      { id: 'lend', label: 'Emprestar', effects: { economy: { lend: { amount: 3000, repayChance: 0.5 } }, social: { affection: 8 } }, resultText: 'Você ajudou quem precisava.' },
      { id: 'no', label: 'Negar', effects: { social: { affection: -8 } }, resultText: 'Ficou um clima estranho.' },
    ],
  },
];
