import { useEffect, useState } from "react";

import { listarEscolas } from "../services/escolaService";

// ============================================
// MENSAGENS DE ERRO
// ============================================

function mensagemDeErro(erro) {
    if (erro.status === 401) {
        return (
            "Sua autenticação expirou ou foi rejeitada. " +
            "Saia do sistema e faça login novamente."
        );
    }

    if (erro.status === 403) {
        return "Você não possui permissão para listar escolas.";
    }

    return erro.message || "Não foi possível carregar as escolas.";
}

// ============================================
// COMPONENTE SELETOR DE ESCOLA
// ============================================

function SeletorEscola({ token, valor, onChange, disabled = false }) {
    // ==========================================
    // ESTADOS DA LISTA
    // ==========================================

    const [escolas, setEscolas] = useState([]);

    const [carregando, setCarregando] = useState(true);

    const [erro, setErro] = useState("");

    const [versaoConsulta, setVersaoConsulta] = useState(0);

    // ==========================================
    // CARREGAR ESCOLAS
    // ==========================================

    useEffect(() => {
        const controller = new AbortController();

        let ativo = true;

        async function carregarEscolas() {
            try {
                const dados = await listarEscolas({
                    token,
                    signal: controller.signal,
                });

                if (ativo) {
                    setEscolas(dados);
                    setErro("");
                }
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setEscolas([]);
                setErro(mensagemDeErro(falha));
            } finally {
                if (ativo) {
                    setCarregando(false);
                }
            }
        }

        carregarEscolas();

        return () => {
            ativo = false;
            controller.abort();
        };
    }, [token, versaoConsulta]);

    // ==========================================
    // ATUALIZAR LISTA
    // ==========================================

    function atualizarEscolas() {
        setEscolas([]);
        setErro("");
        setCarregando(true);

        setVersaoConsulta((anterior) => anterior + 1);
    }

    // ==========================================
    // VERIFICAR SE A ESCOLA SELECIONADA
    // AINDA EXISTE NA LISTA CARREGADA
    // ==========================================

    const escolaSelecionadaDisponivel = escolas.some(
        (escola) => String(escola.id) === String(valor),
    );

    const valorSelect = escolaSelecionadaDisponivel ? String(valor) : "";

    // ==========================================
    // INTERFACE
    // ==========================================

    return (
        <div className="seletor-escola">
            <label htmlFor="seletor-escola-id">Escola</label>

            <div className="seletor-escola-linha">
                <select
                    id="seletor-escola-id"
                    value={valorSelect}
                    onChange={(evento) => {
                        onChange(evento.target.value);
                    }}
                    disabled={
                        disabled ||
                        carregando ||
                        Boolean(erro) ||
                        escolas.length === 0
                    }
                    required
                >
                    <option value="">
                        {carregando
                            ? "Carregando escolas..."
                            : "Selecione uma escola"}
                    </option>

                    {escolas.map((escola) => (
                        <option key={escola.id} value={String(escola.id)}>
                            {escola.nome}
                            {" — "}
                            {escola.cidade || "Cidade não informada"}
                            {escola.ativo === false ? " (Inativa)" : ""}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    className="seletor-escola-atualizar"
                    onClick={atualizarEscolas}
                    disabled={carregando || disabled}
                    aria-label="Atualizar lista de escolas"
                    title="Atualizar lista de escolas"
                >
                    ↻
                </button>
            </div>

            {carregando && (
                <p className="seletor-escola-informacao" role="status">
                    Consultando escolas no FastAPI...
                </p>
            )}

            {erro && (
                <p className="seletor-escola-erro" role="alert">
                    {erro}
                </p>
            )}

            {!carregando && !erro && escolas.length === 0 && (
                <p className="seletor-escola-informacao">
                    Nenhuma escola disponível para sua conta.
                </p>
            )}

            {!carregando && !erro && escolas.length > 0 && (
                <p className="seletor-escola-informacao">
                    {escolas.length}
                    {" escola(s) retornada(s) pela API."}
                </p>
            )}
        </div>
    );
}

export default SeletorEscola;
