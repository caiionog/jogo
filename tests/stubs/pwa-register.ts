/** Stub do módulo virtual do PWA para os testes (no Windows o plugin não resolve o caminho virtual). */
export function registerSW(_opts?: unknown): (reload?: boolean) => Promise<void> {
  return async () => {};
}
