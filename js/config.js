// Configuração geral do Com Fé!: nome, versão e regras de constância
// (sequência de dias, meta diária). Mude APP_VERSION a cada publicação,
// junto com o ?v= do index.html.

export const APP_NAME = "Com Fé!";
export const APP_VERSION = "1.4.0";

// Chave do progresso no localStorage de antes do login (e do modo sem nuvem).
// Continua "catequizando:v1" (nome antigo do app); no primeiro login ele vai para a conta.
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
