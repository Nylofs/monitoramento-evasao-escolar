import { useEffect, useState } from "react";

import { listarTurmas } from "../services/turmaService";

// ==========================================
// FORMATAR TURNO
// ==========================================

function formatarTurno(valor) {
    const turnos = {
        MANHA: "Manhã",
        TARDE: "Tarde",
        NOITE: "Noite",
        INTEGRAL: "Integral",
    };

    const codigo = String(valor ?? "").toUpperCase();

    return turnos[codigo] || String(valor || "Turno não informado");
}

// ==========================================
// COMPONENTE SELETOR DE TURMAS
// ==========================================

function SeletorTurma({ token, valor, onChange, disabled = false }) {
    const [turmas, setTurmas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [versao, setVersao] = useState(0);

    // ========================================
    // BUSCAR TURMAS
    // ========================================

    useEffect(() => {
        const controller = new AbortController();
        let ativo = true;

        async function carregarTurmas() {
            try {
                const dados = await listarTurmas({
                    token,
                    signal: controller.signal,
                });

                if (ativo) {
                    setTurmas(dados);
                    setErro("");
                }
            } catch (falha) {
                if (!ativo || falha.name === "AbortError") {
                    return;
                }

                setTurmas([]);

                if (falha.status === 401) {
                    setErro("Sessão inválida. Faça login novamente.");
                } else if (falha.status === 403) {
                    setErro("Você não tem permissão para listar turmas.");
                } else {
                    setErro(falha.message || "Erro ao carregar turmas.");
                }
            } finally {
                if (ativo) {
                    setCarregando(false);
                }
            }
        }

        carregarTurmas();

        return () => {
            ativo = false;
            controller.abort();
        };
    }, [token, versao]);

    // ========================================
    // ATUALIZAR LISTA
    // ========================================

    function atualizarLista() {
        onChange("");
        setTurmas([]);
        setErro("");
        setCarregando(true);
        setVersao((anterior) => anterior + 1);
    }

    // ========================================
    // VALIDAR OPÇÃO ATUAL
    // ========================================

    const existeOpcao = turmas.some(
        (turma) => String(turma.id) === String(valor),
    );

    const valorSelect = existeOpcao ? String(valor) : "";

    // ========================================
    // INTERFACE
    // ========================================

    return (
        <div className="seletor-entidade">
            <label htmlFor="seletor-turma-id">Turma</label>

            <div className="seletor-entidade-linha">
                <select
                    id="seletor-turma-id"
                    value={valorSelect}
                    onChange={(evento) => {
                        onChange(evento.target.value);
                    }}
                    disabled={
                        disabled ||
                        carregando ||
                        Boolean(erro) ||
                        turmas.length === 0
                    }
                    required
                >
                    <option value="">
                        {carregando
                            ? "Carregando turmas..."
                            : "Selecione uma turma"}
                    </option>

                    {turmas.map((turma) => (
                        <option key={turma.id} value={String(turma.id)}>
                            {turma.nome}
                            {" — "}
                            {formatarTurno(turma.turno)}
                            {" / "}
                            {turma.ano_letivo || "Ano não informado"}
                            {" — Escola ID "}
                            {turma.escola_id}
                            {turma.ativo === false ? " (Inativa)" : ""}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    className="seletor-entidade-atualizar"
                    onClick={atualizarLista}
                    disabled={disabled || carregando}
                    aria-label="Atualizar lista de turmas"
                    title="Atualizar lista de turmas"
                >
                    ↻
                </button>
            </div>

            {carregando && (
                <p className="seletor-entidade-ajuda" role="status">
                    Consultando turmas no FastAPI...
                </p>
            )}

            {erro && (
                <p className="seletor-entidade-erro" role="alert">
                    {erro}
                </p>
            )}

            {!carregando && !erro && turmas.length === 0 && (
                <p className="seletor-entidade-ajuda">
                    Nenhuma turma disponível para sua conta.
                </p>
            )}

            {!carregando && !erro && turmas.length > 0 && (
                <p className="seletor-entidade-ajuda">
                    {turmas.length} turma(s) disponível(is).
                </p>
            )}
        </div>
    );
}

export default SeletorTurma;
