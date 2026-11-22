/** Renderiza o topo da pilha de navegação (um MenuScreen por nível; "Voltar" fecha o nível de cima). */
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AssetKind, CareerCategory, GameState } from '../../../engine';
import { jobDef } from '../../../engine';
import { GAME_CONTENT as C } from '../../../content';
import { MenuScreen } from '../../design/components';
import { bindHistory, useNav } from '../../nav';
import type { ScreenRef } from '../../nav';
import RankingPanel from '../../components/RankingPanel';
import { BemScreen, BensScreen, EmpresaScreen, FinancasScreen, MercadoCatScreen, MercadoScreen, MeusBensScreen } from './assets';
import { AmorScreen, AtividadesScreen, EstudoScreen, LazerScreen, RelacoesScreen, SaudeScreen, TestamentoScreen, TreinoScreen } from './activities';
import { CarreiraLutaScreen, CarreiraScreen, CarreirasCatScreen, CarreirasScreen, EscolaScreen, LutaScreen, MinhaOcupacaoScreen, OcupacaoScreen } from './occupation';

const CAT_TITLE: Record<string, string> = { aprendiz: 'Aprendiz e estágio', meio_periodo: 'Meio período', integral: 'Tempo integral' };
const MARKET_TITLE: Record<string, string> = { imovel: 'Imóveis', veiculo: 'Veículos', luxo: 'Luxo', negocios: 'Empreendimentos' };

function screenOf(r: ScreenRef, game: GameState): { title: string; body: ReactNode } {
  const p = r.params ?? {};
  switch (r.id) {
    case 'ocupacao': return { title: 'Ocupação', body: <OcupacaoScreen game={game} /> };
    case 'minha-ocupacao': return { title: 'Minha ocupação', body: <MinhaOcupacaoScreen game={game} /> };
    case 'carreiras': return { title: 'Carreiras', body: <CarreirasScreen game={game} /> };
    case 'carreiras-cat': return { title: CAT_TITLE[p.cat ?? ''] ?? 'Carreiras', body: <CarreirasCatScreen game={game} cat={p.cat as CareerCategory} /> };
    case 'carreira': return { title: jobDef(C, p.job)?.title ?? 'Carreira', body: <CarreiraScreen game={game} jobId={p.job ?? ''} /> };
    case 'carreira-luta': return { title: 'Carreira de lutador', body: <CarreiraLutaScreen game={game} /> };
    case 'escola': return { title: 'Escola', body: <EscolaScreen game={game} /> };
    case 'luta': return { title: 'Carreira de luta', body: <LutaScreen game={game} /> };
    case 'ranking': return { title: 'Ranking', body: <RankingPanel game={game} /> };
    case 'estudos': return { title: 'Estudos', body: null };
    case 'bens': return { title: 'Bens', body: <BensScreen game={game} /> };
    case 'meus-bens': return { title: 'Meus bens', body: <MeusBensScreen game={game} /> };
    case 'bem': return { title: 'Bem', body: <BemScreen game={game} id={p.id ?? ''} /> };
    case 'empresa': return { title: 'Empreendimento', body: <EmpresaScreen game={game} id={p.id ?? ''} /> };
    case 'mercado': return { title: 'Mercado', body: <MercadoScreen game={game} /> };
    case 'mercado-cat': return { title: MARKET_TITLE[p.cat ?? ''] ?? 'Mercado', body: <MercadoCatScreen game={game} cat={p.cat as AssetKind | 'negocios'} /> };
    case 'financas': return { title: 'Finanças', body: <FinancasScreen game={game} /> };
    case 'relacoes': return { title: 'Relacionamentos', body: <RelacoesScreen game={game} /> };
    case 'atividades': return { title: 'Atividades', body: <AtividadesScreen game={game} /> };
    case 'treino': return { title: 'Treino', body: <TreinoScreen game={game} /> };
    case 'estudo': return { title: 'Estudo', body: <EstudoScreen game={game} /> };
    case 'saude': return { title: 'Saúde', body: <SaudeScreen game={game} /> };
    case 'lazer': return { title: 'Lazer', body: <LazerScreen game={game} /> };
    case 'amor': return { title: 'Amor', body: <AmorScreen game={game} /> };
    case 'testamento': return { title: 'Testamento', body: <TestamentoScreen game={game} /> };
    case 'perfil': return { title: 'Perfil', body: null };
  }
}

export default function NavHost({ game }: { game: GameState }) {
  const stack = useNav((s) => s.stack);
  const back = useNav((s) => s.back);
  useEffect(() => bindHistory(), []);
  const top = stack.at(-1);
  if (!top) return null;
  const { title, body } = screenOf(top, game);
  return (
    <MenuScreen key={`${stack.length}:${top.id}:${JSON.stringify(top.params ?? {})}`} title={title} onBack={back} testId={`screen-${top.id}`}>
      {body}
    </MenuScreen>
  );
}
