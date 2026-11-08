import { apiRequest, ApiError } from "./apiClient";

// ============================================
// AUTENTICAR USUÁRIO
// ============================================

export async function fazerLogin(matricula, senha) {
    const matriculaLimpa = matricula.trim();

    if (!matriculaLimpa || !senha) {
        throw new Error("Informe a matrícula e a senha.");
    }

    // ==========================================
    // ENVIAR CREDENCIAIS AO FASTAPI
    // ==========================================

    const resposta = await apiRequest("/api/auth/login", {
        method: "POST",
        body: {
            matricula: matriculaLimpa,
            senha: senha,
        },
    });

    // ==========================================
    // VALIDAR A RESPOSTA DA API
    // ==========================================

    if (
        !resposta ||
        typeof resposta.access_token !== "string" ||
        resposta.access_token.length === 0
    ) {
        throw new ApiError("A API não retornou um token de acesso válido.");
    }

    if (resposta.token_type && resposta.token_type.toLowerCase() !== "bearer") {
        throw new ApiError(
            "A API retornou um tipo de autenticação inesperado.",
        );
    }

    return {
        accessToken: resposta.access_token,
        tokenType: "Bearer",
    };
}
