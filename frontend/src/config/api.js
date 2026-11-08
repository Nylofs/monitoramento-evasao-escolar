/*
 * Configuração central da API FastAPI.
 *
 * A variável VITE_API_URL é definida
 * no arquivo frontend/.env.
 */

const enderecoConfigurado =
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const API_BASE_URL = enderecoConfigurado.replace(/\/+$/, "");

/*
 * Constrói URLs completas para a API.
 *
 * Exemplos:
 *
 * criarUrlApi("/")
 * criarUrlApi("/api/alertas/alunos/1")
 */

export function criarUrlApi(caminho = "/") {
    const caminhoNormalizado = caminho.startsWith("/")
        ? caminho
        : `/${caminho}`;

    return `${API_BASE_URL}${caminhoNormalizado}`;
}
