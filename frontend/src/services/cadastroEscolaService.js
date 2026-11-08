import { apiRequest, ApiError } from "./apiClient";

// ============================================
// ENDPOINT DE CADASTRO
// Confirme o caminho no Swagger.
// ============================================

const ROTA_CADASTRO = "/api/escolas";

// ============================================
// CRIAR ESCOLA
// ============================================

export async function criarEscola({ nome, cidade, ativo = true, token }) {
    // ==========================================
    // VERIFICAR AUTENTICAÇÃO
    // ==========================================

    if (!token) {
        throw new ApiError("Você precisa estar autenticado.", 401);
    }

    // ==========================================
    // LIMPAR OS VALORES
    // ==========================================

    const nomeLimpo = String(nome ?? "").trim();
    const cidadeLimpa = String(cidade ?? "").trim();

    // ==========================================
    // VALIDAR DADOS OBRIGATÓRIOS
    // ==========================================

    if (!nomeLimpo) {
        throw new Error("Informe o nome da escola.");
    }

    if (!cidadeLimpa) {
        throw new Error("Informe a cidade da escola.");
    }

    // ==========================================
    // CONSTRUIR O REQUEST BODY
    //
    // Ajuste estas propriedades caso o schema
    // de criação no Swagger seja diferente.
    // ==========================================

    const dadosEscola = {
        nome: nomeLimpo,
        cidade: cidadeLimpa,
        ativo: Boolean(ativo),
    };

    // ==========================================
    // ENVIAR POST PARA O FASTAPI
    // ==========================================

    const resposta = await apiRequest(ROTA_CADASTRO, {
        method: "POST",
        token,
        body: dadosEscola,
    });

    // ==========================================
    // DEVOLVER A RESPOSTA
    // ==========================================

    return resposta;
}
