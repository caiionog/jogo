import type { GymDef } from '../../engine';

/**
 * Academias fictícias. `city: null` = existe em qualquer cidade.
 * Mensalidade anual em R$ (cobrada a partir dos 18; antes disso, os pais pagam).
 */
export const GYMS: readonly GymDef[] = [
  // genéricas (qualquer cidade)
  { id: 'gen_bairro', name: 'Academia do Bairro', city: null, fee: 1200, coach: 30, specialty: 'mma', minAge: 4 },
  { id: 'gen_judo_clube', name: 'Clube de Judô Kodokan Vila Nova', city: null, fee: 1500, coach: 45, specialty: 'jiujitsu', minAge: 5 },
  { id: 'gen_boxe', name: 'Boxe Centro Comunitário', city: null, fee: 1000, coach: 40, specialty: 'trocacao', minAge: 8 },
  // São Paulo
  { id: 'sp_tatame_paulista', name: 'Tatame Paulista Jiu-Jitsu', city: 'São Paulo', fee: 4800, coach: 72, specialty: 'jiujitsu', minAge: 4 },
  { id: 'sp_leao_dourado', name: 'Leão Dourado Fight Team', city: 'São Paulo', fee: 9000, coach: 85, specialty: 'mma', minAge: 12 },
  { id: 'sp_muay_zona_leste', name: 'Muay Thai Zona Leste', city: 'São Paulo', fee: 3600, coach: 64, specialty: 'trocacao', minAge: 8 },
  // Rio de Janeiro
  { id: 'rj_irmandade', name: 'Irmandade do Tatame', city: 'Rio de Janeiro', fee: 6000, coach: 82, specialty: 'jiujitsu', minAge: 4 },
  { id: 'rj_morro_fight', name: 'Morro Fight Club', city: 'Rio de Janeiro', fee: 2400, coach: 60, specialty: 'trocacao', minAge: 10 },
  // Belo Horizonte
  { id: 'bh_serra_mma', name: 'Serra MMA', city: 'Belo Horizonte', fee: 4200, coach: 70, specialty: 'mma', minAge: 10 },
  { id: 'bh_galo_wrestling', name: 'Centro de Luta Olímpica Gameleira', city: 'Belo Horizonte', fee: 3000, coach: 66, specialty: 'jiujitsu', minAge: 8 },
  // Curitiba
  { id: 'cwb_pinhao', name: 'Pinhão Team', city: 'Curitiba', fee: 5400, coach: 78, specialty: 'trocacao', minAge: 8 },
  { id: 'cwb_araucaria_bjj', name: 'Araucária Jiu-Jitsu', city: 'Curitiba', fee: 3600, coach: 68, specialty: 'jiujitsu', minAge: 4 },
  // Manaus
  { id: 'mao_rio_negro', name: 'Rio Negro Fight Team', city: 'Manaus', fee: 3000, coach: 70, specialty: 'jiujitsu', minAge: 5 },
  // Recife
  { id: 'rec_capibaribe', name: 'Capibaribe Combat', city: 'Recife', fee: 2800, coach: 66, specialty: 'mma', minAge: 8 },
  // Salvador
  { id: 'ssa_capoeira_mma', name: 'Ginga Bahia MMA', city: 'Salvador', fee: 2600, coach: 62, specialty: 'trocacao', minAge: 6 },
  // Porto Alegre
  { id: 'poa_pampa', name: 'Pampa Wrestling Club', city: 'Porto Alegre', fee: 3400, coach: 72, specialty: 'jiujitsu', minAge: 8 },
  // Outras capitais (Etapa 7: o jogo é só no Brasil)
  { id: 'bsb_cerrado', name: 'Cerrado Fight House', city: 'Brasília', fee: 5200, coach: 74, specialty: 'mma', minAge: 8 },
  { id: 'for_jangada', name: 'Jangada Jiu-Jitsu', city: 'Fortaleza', fee: 2600, coach: 70, specialty: 'jiujitsu', minAge: 5 },
  { id: 'bel_beira_rio', name: 'Muay Thai Beira-Rio', city: 'Belém', fee: 2400, coach: 64, specialty: 'trocacao', minAge: 8 },
  { id: 'gyn_pequi', name: 'Pequi Wrestling', city: 'Goiânia', fee: 3000, coach: 66, specialty: 'jiujitsu', minAge: 8 },
  { id: 'fln_ilha', name: 'Ilha da Magia Combat', city: 'Florianópolis', fee: 4600, coach: 76, specialty: 'mma', minAge: 10 },
];
