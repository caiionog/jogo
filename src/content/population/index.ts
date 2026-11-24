import type { PopulationContent } from '../../engine';

/**
 * Moradores da cidade (release 0.0.4). Bairros fictícios e genéricos (prefixo + nome) e ocupações de fachada para a
 * lista. `immigration` fica vazio até haver dados oficiais por UF e nacionalidade (OBMigra/SISMIGRA): não inventamos
 * percentuais.
 */
export const POPULATION: PopulationContent = {
  neighborhoodPrefixes: ['Jardim', 'Vila', 'Parque', 'Conjunto', 'Residencial', 'Alto', 'Recanto', 'Morada', 'Bairro'],
  neighborhoodNames: [
    'das Acácias', 'dos Ipês', 'Esperança', 'Primavera', 'São Jorge', 'Bela Vista', 'Boa Sorte', 'das Palmeiras',
    'dos Pássaros', 'Novo Horizonte', 'Santa Luzia', 'do Sol', 'das Flores', 'Aurora', 'Liberdade', 'dos Coqueiros',
    'Paraíso', 'Monte Alegre', 'das Mangueiras', 'Serra Verde', 'do Lago', 'Vista Alegre', 'Cruzeiro do Sul',
    'dos Girassóis', 'Bom Retiro', 'Água Clara', 'das Laranjeiras', 'Terra Nova', 'Pôr do Sol', 'das Oliveiras',
  ],
  occupations: [
    'professor(a)', 'comerciante', 'motorista', 'enfermeiro(a)', 'estudante', 'aposentado(a)', 'pedreiro(a)',
    'cozinheiro(a)', 'vendedor(a)', 'técnico(a) de informática', 'cabeleireiro(a)', 'mecânico(a)', 'contador(a)',
    'auxiliar de limpeza', 'entregador(a)', 'advogado(a)', 'médico(a)', 'servidor(a) público(a)', 'atendente',
    'costureiro(a)', 'eletricista', 'feirante', 'programador(a)', 'segurança', 'artesão(ã)', 'músico(a)',
  ],
  immigration: [],
};
