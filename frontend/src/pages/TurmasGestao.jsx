import { useState } from "react";

import Turmas from "./Turmas";

import FormularioTurma from "../components/FormularioTurma";

import FormularioEdicaoTurma from "../components/FormularioEdicaoTurma";

import ExclusaoTurma from "../components/ExclusaoTurma";

// ============================================
// GESTÃO DE TURMAS
// ============================================

function TurmasGestao({ token }) {
    // ==========================================
    // MODO DO FORMULÁRIO
    //
    // null | cadastro | edicao | exclusao
    // ==========================================

    const [modoFormulario, setModoFormulario] = useState(null);

    // ==========================================
    // VERSÃO DA LISTAGEM
    // ==========================================

    const [versaoLista, setVersaoLista] = useState(0);

    // ==========================================
    // ABRIR / FECHAR FORMULÁRIO
    // ==========================================

    function alterarModo(novoModo) {
        setModoFormulario((anterior) => {
            if (anterior === novoModo) {
                return null;
            }

            return novoModo;
        });
    }

    // ==========================================
    // ATUALIZAR LISTAGEM APÓS OPERAÇÃO
    // ==========================================

    function atualizarListagem() {
        setVersaoLista((anterior) => anterior + 1);
    }

    // ==========================================
    // INTERFACE
    // ==========================================

    return (
        <div className="turmas-gestao">
            {/* ======================================
          CABEÇALHO
      ====================================== */}

            <section className="turmas-gestao-acoes">
                <div>
                    <h2>Gestão de turmas</h2>

                    <p>
                        Consulte, cadastre, edite e exclua turmas conforme suas
                        permissões.
                    </p>
                </div>

                <div className="turmas-gestao-botoes">
                    {/* CADASTRO */}

                    <button
                        type="button"
                        className="turmas-gestao-botao"
                        aria-expanded={modoFormulario === "cadastro"}
                        aria-controls="turmas-gestao-formulario"
                        onClick={() => alterarModo("cadastro")}
                    >
                        {modoFormulario === "cadastro"
                            ? "Fechar cadastro"
                            : "+ Nova turma"}
                    </button>

                    {/* EDIÇÃO */}

                    <button
                        type="button"
                        className={
                            "turmas-gestao-botao " +
                            "turmas-gestao-botao--secundario"
                        }
                        aria-expanded={modoFormulario === "edicao"}
                        aria-controls="turmas-gestao-formulario"
                        onClick={() => alterarModo("edicao")}
                    >
                        {modoFormulario === "edicao"
                            ? "Fechar edição"
                            : "Editar turma"}
                    </button>

                    {/* EXCLUSÃO */}

                    <button
                        type="button"
                        className={
                            "turmas-gestao-botao " +
                            "turmas-gestao-botao--perigo"
                        }
                        aria-expanded={modoFormulario === "exclusao"}
                        aria-controls="turmas-gestao-formulario"
                        onClick={() => alterarModo("exclusao")}
                    >
                        {modoFormulario === "exclusao"
                            ? "Fechar exclusão"
                            : "Excluir turma"}
                    </button>
                </div>
            </section>

            {/* ======================================
          ÁREA DOS FORMULÁRIOS
      ====================================== */}

            {modoFormulario !== null && (
                <div id="turmas-gestao-formulario">
                    {/* CADASTRO */}

                    {modoFormulario === "cadastro" && (
                        <FormularioTurma
                            token={token}
                            onCadastroRealizado={atualizarListagem}
                        />
                    )}

                    {/* EDIÇÃO */}

                    {modoFormulario === "edicao" && (
                        <FormularioEdicaoTurma
                            token={token}
                            onAtualizacaoRealizada={atualizarListagem}
                        />
                    )}

                    {/* EXCLUSÃO */}

                    {modoFormulario === "exclusao" && (
                        <ExclusaoTurma
                            token={token}
                            onExclusaoRealizada={atualizarListagem}
                        />
                    )}
                </div>
            )}

            {/* ======================================
          LISTAGEM ORIGINAL
      ====================================== */}

            <Turmas key={versaoLista} token={token} />
        </div>
    );
}

export default TurmasGestao;
