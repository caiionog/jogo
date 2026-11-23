import type { GymDef, ModalityId } from '../../engine';

/**
 * Academias fictícias. `city: null` = existe em qualquer cidade.
 * Mensalidade anual em R$ (cobrada a partir dos 18; antes disso, os pais pagam).
 * `modalities`: o que dá para treinar ali (release 0.0.1). Academias mistas oferecem várias modalidades;
 * as de uma modalidade só rendem um pouco mais nela (ver `specialtyFactor`).
 */
const MMA: ModalityId[] = ['jiujitsu', 'muaythai', 'boxe', 'wrestling'];

export const GYMS: readonly GymDef[] = [
  // genéricas (qualquer cidade)
  { id: 'gen_bairro', name: 'Academia do Bairro', city: null, fee: 1200, coach: 30, modalities: ['jiujitsu', 'muaythai', 'boxe'], minAge: 4 },
  { id: 'gen_judo_clube', name: 'Clube de Judô Kodokan Vila Nova', city: null, fee: 1500, coach: 45, modalities: ['judo'], minAge: 5 },
  { id: 'gen_boxe', name: 'Boxe Centro Comunitário', city: null, fee: 1000, coach: 40, modalities: ['boxe'], minAge: 8 },
  { id: 'gen_muay_thai', name: 'Muay Thai Raça Pura', city: null, fee: 1400, coach: 42, modalities: ['muaythai'], minAge: 7 },
  { id: 'gen_jj_kids', name: 'Jiu-Jitsu Família Tatame', city: null, fee: 1300, coach: 40, modalities: ['jiujitsu'], minAge: 4 },
  // São Paulo
  { id: 'sp_tatame_paulista', name: 'Tatame Paulista Jiu-Jitsu', city: 'São Paulo', fee: 4800, coach: 72, modalities: ['jiujitsu'], minAge: 4 },
  { id: 'sp_leao_dourado', name: 'Leão Dourado Fight Team', city: 'São Paulo', fee: 9000, coach: 85, modalities: MMA, minAge: 12 },
  { id: 'sp_muay_zona_leste', name: 'Muay Thai Zona Leste', city: 'São Paulo', fee: 3600, coach: 64, modalities: ['muaythai'], minAge: 8 },
  { id: 'sp_kick_paulista', name: 'Paulista Kickboxing & Boxe', city: 'São Paulo', fee: 3900, coach: 66, modalities: ['kickboxing', 'boxe'], minAge: 10 },
  // Rio de Janeiro
  { id: 'rj_irmandade', name: 'Irmandade do Tatame', city: 'Rio de Janeiro', fee: 6000, coach: 82, modalities: ['jiujitsu'], minAge: 4 },
  { id: 'rj_morro_fight', name: 'Morro Fight Club', city: 'Rio de Janeiro', fee: 2400, coach: 60, modalities: ['muaythai', 'boxe'], minAge: 10 },
  { id: 'rj_orla_mista', name: 'Orla Jiu-Jitsu & Muay Thai', city: 'Rio de Janeiro', fee: 4200, coach: 70, modalities: ['jiujitsu', 'muaythai'], minAge: 6 },
  // Belo Horizonte
  { id: 'bh_serra_mma', name: 'Serra MMA', city: 'Belo Horizonte', fee: 4200, coach: 70, modalities: MMA, minAge: 10 },
  { id: 'bh_galo_wrestling', name: 'Centro de Luta Olímpica Gameleira', city: 'Belo Horizonte', fee: 3000, coach: 66, modalities: ['wrestling', 'judo'], minAge: 8 },
  { id: 'bh_muay_mineiro', name: 'Muay Thai Mineiro', city: 'Belo Horizonte', fee: 2800, coach: 62, modalities: ['muaythai'], minAge: 8 },
  // Curitiba
  { id: 'cwb_pinhao', name: 'Pinhão Team', city: 'Curitiba', fee: 5400, coach: 78, modalities: ['muaythai', 'boxe', 'kickboxing'], minAge: 8 },
  { id: 'cwb_araucaria_bjj', name: 'Araucária Jiu-Jitsu', city: 'Curitiba', fee: 3600, coach: 68, modalities: ['jiujitsu'], minAge: 4 },
  // Manaus
  { id: 'mao_rio_negro', name: 'Rio Negro Fight Team', city: 'Manaus', fee: 3000, coach: 70, modalities: ['jiujitsu', 'muaythai'], minAge: 5 },
  // Recife
  { id: 'rec_capibaribe', name: 'Capibaribe Combat', city: 'Recife', fee: 2800, coach: 66, modalities: MMA, minAge: 8 },
  { id: 'rec_frevo_muay', name: 'Frevo Muay Thai', city: 'Recife', fee: 2200, coach: 60, modalities: ['muaythai'], minAge: 7 },
  // Salvador
  { id: 'ssa_capoeira_mma', name: 'Ginga Bahia MMA', city: 'Salvador', fee: 2600, coach: 62, modalities: ['muaythai', 'boxe', 'jiujitsu'], minAge: 6 },
  { id: 'ssa_judo_baiano', name: 'Associação Baiana de Judô', city: 'Salvador', fee: 1800, coach: 64, modalities: ['judo'], minAge: 5 },
  // Porto Alegre
  { id: 'poa_pampa', name: 'Pampa Wrestling Club', city: 'Porto Alegre', fee: 3400, coach: 72, modalities: ['wrestling'], minAge: 8 },
  { id: 'poa_guaiba_mista', name: 'Guaíba Jiu-Jitsu & Muay Thai', city: 'Porto Alegre', fee: 3800, coach: 68, modalities: ['jiujitsu', 'muaythai'], minAge: 5 },
  // Outras capitais (Etapa 7: o jogo é só no Brasil)
  { id: 'bsb_cerrado', name: 'Cerrado Fight House', city: 'Brasília', fee: 5200, coach: 74, modalities: MMA, minAge: 8 },
  { id: 'for_jangada', name: 'Jangada Jiu-Jitsu', city: 'Fortaleza', fee: 2600, coach: 70, modalities: ['jiujitsu'], minAge: 5 },
  { id: 'for_dragao_muay', name: 'Dragão do Mar Muay Thai', city: 'Fortaleza', fee: 2400, coach: 66, modalities: ['muaythai', 'boxe'], minAge: 7 },
  { id: 'bel_beira_rio', name: 'Muay Thai Beira-Rio', city: 'Belém', fee: 2400, coach: 64, modalities: ['muaythai'], minAge: 8 },
  { id: 'gyn_pequi', name: 'Pequi Wrestling', city: 'Goiânia', fee: 3000, coach: 66, modalities: ['wrestling', 'jiujitsu'], minAge: 8 },
  { id: 'fln_ilha', name: 'Ilha da Magia Combat', city: 'Florianópolis', fee: 4600, coach: 76, modalities: MMA, minAge: 10 },
];
