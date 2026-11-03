// Configuração geral do Catequizando: nome, versão e regras de constância
// (sequência de dias, meta diária). Mude APP_VERSION a cada publicação,
// junto com o ?v= do index.html.

export const APP_NAME = "Catequizando";
export const APP_VERSION = "1.1.0";

// Chave do progresso no localStorage. Sem login, existe um único perfil por aparelho.
export const STORAGE_KEY = "catequizando:v1";

// Meta diária: a pessoa escolhe o tipo e o valor em Meu progresso.
export const META = {
  padrao: { tipo: "capitulos", valor: 1 },
  opcoes: {
    minutos: [5, 10, 15, 20],
    capitulos: [1, 2, 3, 4],
  },
};

// Sequência: quantos "dias de descanso" por semana não quebram a sequência.
export const SEQUENCIA = { descansosPorSemana: 1 };

// Quantas atividades recentes guardar no aparelho.
export const MAX_ATIVIDADES = 50;
