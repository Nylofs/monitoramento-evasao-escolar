import { useState } from "react";

import Intervencoes from "./Intervencoes";

import FormularioIntervencao from "../components/FormularioIntervencao";

import FormularioEdicaoIntervencao from "../components/FormularioEdicaoIntervencao";

// ============================================
// ETAPA 15 - PARTE 29
// GESTÃO DE INTERVENÇÕES
// ============================================

function IntervencoesGestao({ token }) {
    // ==========================================
    // MODO DO FORMULÁRIO
    //
    // null | cadastro | edicao
    // ==========================================

    const [modoFormulario, setModoFormulario] = useState(null);

    // ==========================================
    // CONTROLE DA LISTAGEM
    // ==========================================

    const [versaoLista, setVersaoLista] = useState(0);

    // ==========================================
    // ABRIR OU FECHAR FORMULÁRIO
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
                        Consulte, registre e atualize as ações de acompanhamento
                        escolar.
                    </p>
                </div>

                <div className="intervencoes-gestao-botoes">
                    {/* ==================================
              CADASTRO
          ================================== */}

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

                    {/* ==================================
              EDIÇÃO
          ================================== */}

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
                </div>
            </section>

            {/* ======================================
          FORMULÁRIOS
      ====================================== */}

            {modoFormulario !== null && (
                <div id="intervencoes-gestao-formulario">
                    {/* CADASTRO EXISTENTE */}

                    {modoFormulario === "cadastro" && (
                        <FormularioIntervencao
                            token={token}
                            onCadastroRealizado={atualizarListagem}
                        />
                    )}

                    {/* NOVA EDIÇÃO */}

                    {modoFormulario === "edicao" && (
                        <FormularioEdicaoIntervencao
                            token={token}
                            onAtualizacaoRealizada={atualizarListagem}
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
