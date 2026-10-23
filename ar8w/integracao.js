/* O mesmo armazenamento do caderno recebe as provas e as fotos da câmera mágica. */
export function integrarJogo(estado) {
  if (!window.Dados) return;
  const sincronizar = () => Dados.integrarAR(estado.valor);
  estado.eventos.addEventListener('change', sincronizar);
  sincronizar();
}
