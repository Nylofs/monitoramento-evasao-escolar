import { useState } from "react";

import { fazerLogin } from "../services/authService";

// ============================================
// COMPONENTE DA TELA DE LOGIN
// ============================================

function Login({ onLogin }) {
    // ==========================================
    // ESTADOS DO FORMULÁRIO
    // ==========================================

    const [matricula, setMatricula] = useState("");

    const [senha, setSenha] = useState("");

    const [mostrarSenha, setMostrarSenha] = useState(false);

    const [carregando, setCarregando] = useState(false);

    const [erro, setErro] = useState("");

    // ==========================================
    // PROCESSAR O LOGIN
    // ==========================================

    async function enviarLogin(evento) {
        evento.preventDefault();

        if (carregando) {
            return;
        }

        setErro("");

        const matriculaLimpa = matricula.trim();

        if (!matriculaLimpa || !senha) {
            setErro("Preencha a matrícula e a senha.");
            return;
        }

        setCarregando(true);

        try {
            const autenticacao = await fazerLogin(matriculaLimpa, senha);

            // Informar ao App que a API
            // autenticou as credenciais.
            onLogin({
                matricula: matriculaLimpa,
                accessToken: autenticacao.accessToken,
            });

            // Não manter a senha após o sucesso.
            setSenha("");
        } catch (falha) {
            if (falha.status === 401 || falha.status === 403) {
                setErro("Matrícula ou senha inválida, ou conta sem acesso.");
            } else {
                setErro(falha.message || "Não foi possível realizar o login.");
            }

            setSenha("");
        } finally {
            setCarregando(false);
        }
    }

    // ==========================================
    // INTERFACE
    // ==========================================

    return (
        <main className="login-pagina">
            <div className="login-cartao">
                <div className="login-marca">
                    <span className="login-icone" aria-hidden="true">
                        🎓
                    </span>

                    <div>
                        <h1>Monitoramento Escolar</h1>

                        <p>Prevenção de Evasão Escolar</p>
                    </div>
                </div>

                <div className="login-introducao">
                    <h2>Acesse sua conta</h2>

                    <p>Informe a matrícula e a senha cadastradas no sistema.</p>
                </div>

                <form onSubmit={enviarLogin}>
                    {/* CAMPO DE MATRÍCULA */}

                    <div className="login-campo">
                        <label htmlFor="matricula">Matrícula</label>

                        <input
                            id="matricula"
                            name="matricula"
                            type="text"
                            autoComplete="username"
                            placeholder="Digite sua matrícula"
                            value={matricula}
                            onChange={(evento) => {
                                setMatricula(evento.target.value);
                            }}
                            disabled={carregando}
                            required
                        />
                    </div>

                    {/* CAMPO DE SENHA */}

                    <div className="login-campo">
                        <label htmlFor="senha">Senha</label>

                        <div className="login-senha-container">
                            <input
                                id="senha"
                                name="senha"
                                type={mostrarSenha ? "text" : "password"}
                                autoComplete="current-password"
                                placeholder="Digite sua senha"
                                value={senha}
                                onChange={(evento) => {
                                    setSenha(evento.target.value);
                                }}
                                disabled={carregando}
                                required
                            />

                            <button
                                type="button"
                                className="login-mostrar-senha"
                                onClick={() => {
                                    setMostrarSenha(!mostrarSenha);
                                }}
                                disabled={carregando}
                                aria-label={
                                    mostrarSenha
                                        ? "Ocultar senha"
                                        : "Mostrar senha"
                                }
                            >
                                {mostrarSenha ? "Ocultar" : "Mostrar"}
                            </button>
                        </div>
                    </div>

                    {/* MENSAGEM DE ERRO */}

                    {erro && (
                        <div className="login-erro" role="alert">
                            {erro}
                        </div>
                    )}

                    {/* BOTÃO ENTRAR */}

                    <button
                        type="submit"
                        className="login-botao"
                        disabled={carregando}
                    >
                        {carregando ? "Autenticando..." : "Entrar no sistema"}
                    </button>
                </form>

                <p className="login-observacao">
                    Acesso destinado a usuários autorizados da instituição.
                </p>
            </div>
        </main>
    );
}

export default Login;
