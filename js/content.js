// Leitura dos arquivos de conteúdo em data/ (gerados pelos scripts de tools/).
// Guarda em memória o que já foi lido, para não buscar duas vezes.

const memoria = new Map();

export async function carregar(caminho) {
  if (memoria.has(caminho)) return memoria.get(caminho);
  const p = fetch(`data/${caminho}`).then(r => {
    if (!r.ok) throw new Error(`Não encontrei data/${caminho}`);
    return r.json();
  });
  memoria.set(caminho, p);
  try { return await p; } catch (e) { memoria.delete(caminho); throw e; }
}
