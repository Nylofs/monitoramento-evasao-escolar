import { useEffect, useState } from "react";

import SeletorEscola from "./SeletorEscola";

import {
    buscarEscolaParaEdicao,
    atualizarEscola,
} from "../services/edicaoEscolaService";

// ============================================
// TRATAMENTO DE ERROS
// ============================================

function mensagemDeErro(erro) {
    if (erro.status === 401) {
        return (
            "Sua autenticação foi rejeitada ou expirou. " +
            "Saia do sistema e faça login novamente."
        );
    }

    if (erro.status === 403) {
        return (
            "Você não possui permissão para " +
            "consultar ou editar esta escola."
        );
    }

    if (erro.status === 404) {
        return "Escola não encontrada ou sem acesso.";
    }

    if (erro.status === 409) {
        return "A alteração entrou em conflito com outro registro.";
    }

    if (erro.status === 422) {
        return (
            "O FastAPI rejeitou os dados. " +
            "Confira o Request Body no Swagger " +
            "e a resposta na aba Network."
        );
    }

    return erro.message || "Não foi possível atualizar a escola.";
}

// ============================================
// CAMPOS DE EDIÇÃO
// ============================================

function CamposEdicao({ escola, token, onAtualizacaoRealizada }) {
    const [nome, setNome] = useState(escola.nome ?? "");
    const [cidade, setCidade] = useState(escola.cidade ?? "");
    const [ativo, setAtivo] = useState(escola.ativo === true);

    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    // ==========================================
    // VERIFICAR SE OS DADOS FORAM ALTERADOS
    // ==========================================

    const alterado =
        nome !== (escola.nome ?? "") ||
        cidade !== (escola.cidade ?? "") ||
        ativo !== (escola.ativo === true);

    // ==========================================
    // RESTAURAR VALORES ORIGINAIS
    // ==========================================

    function restaurarCampos() {
        setNome(escola.nome ?? "");
        setCidade(escola.cidade ?? "");
        setAtivo(escola.ativo === true);
        setErro("");
        setSucesso("");
    }

    // ==========================================
    // ENVIAR ATUALIZAÇÃO
    // ==========================================

    async function enviarAtualizacao(evento) {
        evento.preventDefault();

        if (salvando || !alterado) {
            return;
        }

        const nomeLimpo = nome.trim();
        const cidadeLimpa = cidade.trim();

        if (!nomeLimpo || !cidadeLimpa) {
            setErro("Preencha o nome e a cidade da escola.");
            return;
        }

        setErro("");
        setSucesso("");
        setSalvando(true);

        try {
            await atualizarEscola({
                escolaId: escola.id,
                nome: nomeLimpo,
                cidade: cidadeLimpa,
                ativo,
                token,
            });

            setSucesso("Escola atualizada com sucesso!");

            // Comunica a atualização ao componente pai.
            onAtualizacaoRealizada?.();
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
        <form className="edicao-escola-formulario" onSubmit={enviarAtualizacao}>
            <div className="edicao-escola-identificacao">
                <strong>Escola ID {escola.id}</strong>
                <span>Altere os campos desejados e salve.</span>
            </div>

            <div className="edicao-escola-campos">
                {/* NOME */}

                <div className="edicao-escola-campo">
                    <label htmlFor="edicao-escola-nome">Nome da escola *</label>

                    <input
                        id="edicao-escola-nome"
                        type="text"
                        value={nome}
                        maxLength={200}
                        required
                        disabled={salvando}
                        onChange={(evento) => {
                            setNome(evento.target.value);
                            setErro("");
                            setSucesso("");
                        }}
                    />
                </div>

                {/* CIDADE */}

                <div className="edicao-escola-campo">
                    <label htmlFor="edicao-escola-cidade">Cidade *</label>

                    <input
                        id="edicao-escola-cidade"
                        type="text"
                        value={cidade}
                        maxLength={120}
                        required
                        disabled={salvando}
                        onChange={(evento) => {
                            setCidade(evento.target.value);
                            setErro("");
                            setSucesso("");
                        }}
                    />
                </div>
            </div>

            {/* SITUAÇÃO */}

            <label className="edicao-escola-checkbox">
                <input
                    type="checkbox"
                    checked={ativo}
                    disabled={salvando}
                    onChange={(evento) => {
                        setAtivo(evento.target.checked);
                        setErro("");
                        setSucesso("");
                    }}
                />

                <span>
                    <strong>Cadastro ativo</strong>
                    <small>
                        Desmarque para solicitar a desativação da instituição.
                    </small>
                </span>
            </label>

            {/* MENSAGENS */}

            {erro && (
                <p
                    className="edicao-escola-mensagem edicao-escola-mensagem--erro"
                    role="alert"
                >
                    {erro}
                </p>
            )}

            {sucesso && (
                <p
                    className="edicao-escola-mensagem edicao-escola-mensagem--sucesso"
                    role="status"
                >
                    {sucesso}
                </p>
            )}

            {/* BOTÕES */}

            <div className="edicao-escola-acoes">
                <button
                    type="submit"
                    className="edicao-escola-botao-salvar"
                    disabled={salvando || !alterado}
                >
                    {salvando ? "Salvando alterações..." : "Salvar alterações"}
                </button>

                <button
                    type="button"
                    className="edicao-escola-botao-restaurar"
                    onClick={restaurarCampos}
                    disabled={salvando}
                >
                    Desfazer alterações locais
                </button>
            </div>

            <p className="edicao-escola-observacao">
                A atualização somente será aplicada se o FastAPI autorizar a
                operação. Desativar uma escola pode afetar a disponibilidade
                dela em outras consultas.
            </p>
        </form>
    );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function FormularioEdicaoEscola({ token, onAtualizacaoRealizada }) {
    const [escolaId, setEscolaId] = useState("");

    const [escola, setEscola] = useState(null);

    const [carregando, setCarregando] = useState(false);

    const [erro, setErro] = useState("");

    const [versaoConsulta, setVersaoConsulta] = useState(0);

    // ==========================================
    // SELECIONAR ESCOLA
    // ==========================================

    function selecionarEscola(novoId) {
        setEscolaId(novoId);
        setEscola(null);
        setErro("");
        setCarregando(Boolean(novoId));
    }

    // ==========================================
    // CONSULTAR DADOS ATUAIS
    // ==========================================

    useEffect(() => {
        if (!escolaId) {
            return;
        }

        const controller = new AbortController();
        let ativo = true;

        async function carregarEscola() {
            try {
                const dados = await buscarEscolaParaEdicao({
                    escolaId,
                    token,
                    signal: controller.signal,
                });

                if (ativo) {
                    setEscola(dados);
                    setErro("");
                }
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setEscola(null);
                setErro(mensagemDeErro(falha));
            } finally {
                if (ativo) {
                    setCarregando(false);
                }
            }
        }

        carregarEscola();

        return () => {
            ativo = false;
            controller.abort();
        };
    }, [escolaId, token, versaoConsulta]);

    // ==========================================
    // RECARREGAR DADOS DA ESCOLA
    // ==========================================

    function recarregarEscola() {
        if (!escolaId) return;

        setCarregando(true);
        setEscola(null);
        setErro("");

        setVersaoConsulta((anterior) => anterior + 1);
    }

    // ==========================================
    // ATUALIZAÇÃO CONFIRMADA
    // ==========================================

    function atualizarListagem() {
        onAtualizacaoRealizada?.();
    }

    // ==========================================
    // INTERFACE
    // ==========================================

    return (
        <section className="edicao-escola">
            <div className="edicao-escola-topo">
                <h2>Editar escola</h2>

                <p>
                    Selecione uma instituição para consultar e alterar seus
                    dados cadastrais.
                </p>
            </div>

            <div className="edicao-escola-selecao">
                <SeletorEscola
                    token={token}
                    valor={escolaId}
                    onChange={selecionarEscola}
                    disabled={carregando}
                />

                <button
                    type="button"
                    className="edicao-escola-botao-restaurar"
                    onClick={recarregarEscola}
                    disabled={!escolaId || carregando}
                >
                    Recarregar dados da escola
                </button>
            </div>

            {carregando && (
                <p className="edicao-escola-mensagem" role="status">
                    Consultando os dados atuais da escola...
                </p>
            )}

            {erro && (
                <p
                    className="edicao-escola-mensagem edicao-escola-mensagem--erro"
                    role="alert"
                >
                    {erro}
                </p>
            )}

            {!escolaId && (
                <p className="edicao-escola-orientacao">
                    Selecione uma escola na lista acima para carregar o
                    formulário.
                </p>
            )}

            {escola && !carregando && (
                <CamposEdicao
                    key={`${escolaId}-${versaoConsulta}`}
                    escola={escola}
                    token={token}
                    onAtualizacaoRealizada={atualizarListagem}
                />
            )}
        </section>
    );
}

export default FormularioEdicaoEscola;
