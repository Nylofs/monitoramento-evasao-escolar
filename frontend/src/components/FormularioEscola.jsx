import { useState } from "react";

import { criarEscola } from "../services/cadastroEscolaService";

// ============================================
// INTERPRETAR ERROS DO FASTAPI
// ============================================

function mensagemDeErro(erro) {
    if (erro.status === 401) {
        return (
            "Sua sessão foi rejeitada ou expirou. " +
            "Saia do sistema e faça login novamente."
        );
    }

    if (erro.status === 403) {
        return "Você não possui permissão para cadastrar escolas.";
    }

    if (erro.status === 409) {
        return "O cadastro entrou em conflito com um registro existente.";
    }

    if (erro.status === 422) {
        return (
            "Os dados foram rejeitados pelo FastAPI. " +
            "Confira os campos obrigatórios no Swagger " +
            "e os detalhes da resposta na aba Network."
        );
    }

    return erro.message || "Não foi possível cadastrar a escola.";
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function FormularioEscola({ token, onCadastroRealizado }) {
    // ==========================================
    // CAMPOS
    // ==========================================

    const [nome, setNome] = useState("");
    const [cidade, setCidade] = useState("");
    const [ativo, setAtivo] = useState(true);

    // ==========================================
    // ESTADOS DE EXECUÇÃO
    // ==========================================

    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    // ==========================================
    // LIMPAR CAMPOS
    // ==========================================

    function limparCampos() {
        setNome("");
        setCidade("");
        setAtivo(true);
        setErro("");
        setSucesso("");
    }

    // ==========================================
    // ENVIAR CADASTRO
    // ==========================================

    async function enviarCadastro(evento) {
        evento.preventDefault();

        if (salvando) return;

        setErro("");
        setSucesso("");

        const nomeLimpo = nome.trim();
        const cidadeLimpa = cidade.trim();

        if (!nomeLimpo || !cidadeLimpa) {
            setErro("Preencha o nome e a cidade da escola.");
            return;
        }

        setSalvando(true);

        try {
            const resposta = await criarEscola({
                nome: nomeLimpo,
                cidade: cidadeLimpa,
                ativo,
                token,
            });

            // O Service só retorna normalmente
            // quando o servidor responde com sucesso.
            setSucesso("Escola cadastrada com sucesso!");

            // Limpa apenas os campos após o sucesso.
            setNome("");
            setCidade("");
            setAtivo(true);

            // Comunica ao componente pai para
            // atualizar a listagem existente.
            onCadastroRealizado?.(resposta);
        } catch (falha) {
            setErro(mensagemDeErro(falha));
        } finally {
            setSalvando(false);
        }
    }

    // ==========================================
    // INTERFACE
    // ==========================================

    return (
        <section
            className="cadastro-escola"
            aria-labelledby="titulo-cadastro-escola"
        >
            <div className="cadastro-escola-topo">
                <div>
                    <h2 id="titulo-cadastro-escola">Cadastrar nova escola</h2>

                    <p>
                        Preencha as informações da instituição e envie o
                        cadastro para o FastAPI.
                    </p>
                </div>

                <span className="cadastro-escola-icone" aria-hidden="true">
                    🏫
                </span>
            </div>

            <form onSubmit={enviarCadastro}>
                <div className="cadastro-escola-campos">
                    {/* NOME */}

                    <div className="cadastro-escola-campo">
                        <label htmlFor="cadastro-escola-nome">
                            Nome da escola *
                        </label>

                        <input
                            id="cadastro-escola-nome"
                            name="nome"
                            type="text"
                            placeholder="Digite o nome da escola"
                            value={nome}
                            maxLength={200}
                            onChange={(evento) => {
                                setNome(evento.target.value);
                                setErro("");
                                setSucesso("");
                            }}
                            disabled={salvando}
                            required
                        />
                    </div>

                    {/* CIDADE */}

                    <div className="cadastro-escola-campo">
                        <label htmlFor="cadastro-escola-cidade">Cidade *</label>

                        <input
                            id="cadastro-escola-cidade"
                            name="cidade"
                            type="text"
                            placeholder="Digite a cidade"
                            value={cidade}
                            maxLength={120}
                            onChange={(evento) => {
                                setCidade(evento.target.value);
                                setErro("");
                                setSucesso("");
                            }}
                            disabled={salvando}
                            required
                        />
                    </div>
                </div>

                {/* SITUAÇÃO */}

                <label className="cadastro-escola-checkbox">
                    <input
                        type="checkbox"
                        checked={ativo}
                        onChange={(evento) => {
                            setAtivo(evento.target.checked);
                            setSucesso("");
                        }}
                        disabled={salvando}
                    />

                    <span>
                        <strong>Cadastro ativo</strong>
                        <small>
                            Desmarque para solicitar a criação de uma escola
                            inativa.
                        </small>
                    </span>
                </label>

                {/* MENSAGENS */}

                {erro && (
                    <p
                        className="cadastro-escola-mensagem cadastro-escola-mensagem--erro"
                        role="alert"
                    >
                        {erro}
                    </p>
                )}

                {sucesso && (
                    <p
                        className="cadastro-escola-mensagem cadastro-escola-mensagem--sucesso"
                        role="status"
                    >
                        {sucesso}
                    </p>
                )}

                {/* BOTÕES */}

                <div className="cadastro-escola-acoes">
                    <button
                        type="submit"
                        className="cadastro-escola-botao-salvar"
                        disabled={salvando}
                    >
                        {salvando ? "Salvando escola..." : "Cadastrar escola"}
                    </button>

                    <button
                        type="button"
                        className="cadastro-escola-botao-limpar"
                        onClick={limparCampos}
                        disabled={salvando}
                    >
                        Limpar formulário
                    </button>
                </div>
            </form>

            <p className="cadastro-escola-observacao">
                Os dados serão validados pelo FastAPI. O cadastro somente será
                realizado se sua conta possuir permissão.
            </p>
        </section>
    );
}

export default FormularioEscola;
