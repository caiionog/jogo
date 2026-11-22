import type { GymDef } from '../../engine';

/**
 * Academias fictícias. `city: null` = existe em qualquer cidade.
 * Mensalidade anual em R$ (cobrada a partir dos 18; antes disso, os pais pagam).
 */
export const GYMS: readonly GymDef[] = [
  // genéricas (qualquer cidade)
  { id: 'gen_bairro', name: 'Academia do Bairro', city: null, fee: 1200, coach: 30, specialty: 'mma', minAge: 4 },
  { id: 'gen_judo_clube', name: 'Clube de Judô Kodokan Vila Nova', city: null, fee: 1500, coach: 45, specialty: 'wrestling', minAge: 5 },
  { id: 'gen_boxe', name: 'Boxe Centro Comunitário', city: null, fee: 1000, coach: 40, specialty: 'striking', minAge: 8 },
  // São Paulo
  { id: 'sp_tatame_paulista', name: 'Tatame Paulista Jiu-Jitsu', city: 'São Paulo', fee: 4800, coach: 72, specialty: 'grappling', minAge: 4 },
  { id: 'sp_leao_dourado', name: 'Leão Dourado Fight Team', city: 'São Paulo', fee: 9000, coach: 85, specialty: 'mma', minAge: 12 },
  { id: 'sp_muay_zona_leste', name: 'Muay Thai Zona Leste', city: 'São Paulo', fee: 3600, coach: 64, specialty: 'striking', minAge: 8 },
  // Rio de Janeiro
  { id: 'rj_irmandade', name: 'Irmandade do Tatame', city: 'Rio de Janeiro', fee: 6000, coach: 82, specialty: 'grappling', minAge: 4 },
  { id: 'rj_morro_fight', name: 'Morro Fight Club', city: 'Rio de Janeiro', fee: 2400, coach: 60, specialty: 'striking', minAge: 10 },
  // Belo Horizonte
  { id: 'bh_serra_mma', name: 'Serra MMA', city: 'Belo Horizonte', fee: 4200, coach: 70, specialty: 'mma', minAge: 10 },
  { id: 'bh_galo_wrestling', name: 'Centro de Luta Olímpica Gameleira', city: 'Belo Horizonte', fee: 3000, coach: 66, specialty: 'wrestling', minAge: 8 },
  // Curitiba
  { id: 'cwb_pinhao', name: 'Pinhão Team', city: 'Curitiba', fee: 5400, coach: 78, specialty: 'striking', minAge: 8 },
  { id: 'cwb_araucaria_bjj', name: 'Araucária Jiu-Jitsu', city: 'Curitiba', fee: 3600, coach: 68, specialty: 'grappling', minAge: 4 },
  // Manaus
  { id: 'mao_rio_negro', name: 'Rio Negro Fight Team', city: 'Manaus', fee: 3000, coach: 70, specialty: 'grappling', minAge: 5 },
  // Recife
  { id: 'rec_capibaribe', name: 'Capibaribe Combat', city: 'Recife', fee: 2800, coach: 66, specialty: 'mma', minAge: 8 },
  // Salvador
  { id: 'ssa_capoeira_mma', name: 'Ginga Bahia MMA', city: 'Salvador', fee: 2600, coach: 62, specialty: 'striking', minAge: 6 },
  // Porto Alegre
  { id: 'poa_pampa', name: 'Pampa Wrestling Club', city: 'Porto Alegre', fee: 3400, coach: 72, specialty: 'wrestling', minAge: 8 },
  // exterior
  { id: 'lis_tejo', name: 'Tejo Combat Academy', city: 'Lisboa', fee: 5000, coach: 70, specialty: 'mma', minAge: 8 },
  { id: 'por_ribeira', name: 'Ribeira Jiu-Jitsu', city: 'Porto', fee: 3800, coach: 65, specialty: 'grappling', minAge: 5 },
  { id: 'lv_desert_forge', name: 'Desert Forge MMA', city: 'Las Vegas', fee: 12000, coach: 90, specialty: 'mma', minAge: 14 },
  { id: 'mia_south_beach', name: 'South Beach Grappling', city: 'Miami', fee: 7000, coach: 76, specialty: 'grappling', minAge: 5 },
  { id: 'ny_iron_borough', name: 'Iron Borough Boxing', city: 'Nova York', fee: 6000, coach: 74, specialty: 'striking', minAge: 10 },
  { id: 'sd_coastline', name: 'Coastline Wrestling', city: 'San Diego', fee: 5500, coach: 73, specialty: 'wrestling', minAge: 8 },
  { id: 'tok_sakura_dojo', name: 'Dojo Sakura Kai', city: 'Tóquio', fee: 6000, coach: 78, specialty: 'wrestling', minAge: 5 },
  { id: 'osa_naniwa', name: 'Naniwa Kickboxing', city: 'Osaka', fee: 4500, coach: 70, specialty: 'striking', minAge: 8 },
  { id: 'mx_azteca', name: 'Gimnasio Águila Azteca', city: 'Cidade do México', fee: 3000, coach: 68, specialty: 'striking', minAge: 8 },
  { id: 'tij_frontera', name: 'Frontera Fight Lab', city: 'Tijuana', fee: 3200, coach: 66, specialty: 'mma', minAge: 10 },
];
