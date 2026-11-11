import { useState } from "react";

import Intervencoes from "./Intervencoes";

import FormularioIntervencao from "../components/FormularioIntervencao";

import FormularioEdicaoIntervencao from "../components/FormularioEdicaoIntervencao";

import ExclusaoIntervencao from "../components/ExclusaoIntervencao";

// ============================================
// ETAPA 15 - PARTE 30
// GESTÃO DE INTERVENÇÕES
// ============================================

function IntervencoesGestao({ token }) {
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
    // ALTERNAR MODO
    // ==========================================

    function alterarModo(novoModo) {
        setModoFormulario((anterior) =>
            anterior === novoModo ? null : novoModo,
        );
    }

    // ==========================================
    // ATUALIZAR LISTAGEM
    // ==========================================

    function atualizarListagem() {
        setVersaoLista((anterior) => anterior + 1);
    }

    // ==========================================
    // INTERFACE
    // ==========================================

    return (
        <div className="intervencoes-gestao">
            {/* ======================================
          CABEÇALHO
      ====================================== */}

            <section className="intervencoes-gestao-acoes">
                <div>
                    <h2>Gestão de intervenções</h2>

                    <p>
                        Consulte, registre, edite e exclua intervenções conforme
                        suas permissões.
                    </p>
                </div>

                <div className="intervencoes-gestao-botoes">
                    {/* CADASTRO */}

                    <button
                        type="button"
                        className="intervencoes-gestao-botao"
                        onClick={() => alterarModo("cadastro")}
                        aria-expanded={modoFormulario === "cadastro"}
                        aria-controls="intervencoes-gestao-formulario"
                    >
                        {modoFormulario === "cadastro"
                            ? "Fechar cadastro"
                            : "+ Registrar intervenção"}
                    </button>

                    {/* EDIÇÃO */}

                    <button
                        type="button"
                        className={
                            "intervencoes-gestao-botao " +
                            "intervencoes-gestao-botao--secundario"
                        }
                        onClick={() => alterarModo("edicao")}
                        aria-expanded={modoFormulario === "edicao"}
                        aria-controls="intervencoes-gestao-formulario"
                    >
                        {modoFormulario === "edicao"
                            ? "Fechar edição"
                            : "Editar intervenção"}
                    </button>

                    {/* EXCLUSÃO */}

                    <button
                        type="button"
                        className={
                            "intervencoes-gestao-botao " +
                            "intervencoes-gestao-botao--perigo"
                        }
                        onClick={() => alterarModo("exclusao")}
                        aria-expanded={modoFormulario === "exclusao"}
                        aria-controls="intervencoes-gestao-formulario"
                    >
                        {modoFormulario === "exclusao"
                            ? "Fechar exclusão"
                            : "Excluir intervenção"}
                    </button>
                </div>
            </section>

            {/* ======================================
          FORMULÁRIOS
      ====================================== */}

            {modoFormulario !== null && (
                <div id="intervencoes-gestao-formulario">
                    {/* CADASTRO */}

                    {modoFormulario === "cadastro" && (
                        <FormularioIntervencao
                            token={token}
                            onCadastroRealizado={atualizarListagem}
                        />
                    )}

                    {/* EDIÇÃO */}

                    {modoFormulario === "edicao" && (
                        <FormularioEdicaoIntervencao
                            token={token}
                            onAtualizacaoRealizada={atualizarListagem}
                        />
                    )}

                    {/* EXCLUSÃO */}

                    {modoFormulario === "exclusao" && (
                        <ExclusaoIntervencao
                            token={token}
                            onExclusaoRealizada={atualizarListagem}
                        />
                    )}
                </div>
            )}

            {/* ======================================
          LISTAGEM EXISTENTE
      ====================================== */}

            <Intervencoes key={versaoLista} token={token} />
        </div>
    );
}

export default IntervencoesGestao;
