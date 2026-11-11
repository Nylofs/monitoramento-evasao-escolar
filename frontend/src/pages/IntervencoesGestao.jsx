import { useState } from "react";

import Intervencoes from "./Intervencoes";

import FormularioIntervencao from "../components/FormularioIntervencao";

// ============================================
// GESTÃO DE INTERVENÇÕES
// ============================================

function IntervencoesGestao({ token }) {
    // Controla a exibição do cadastro.
    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    // Controla o recarregamento da listagem.
    const [versaoLista, setVersaoLista] = useState(0);

    // ==========================================
    // ABRIR OU FECHAR CADASTRO
    // ==========================================

    function alternarFormulario() {
        setMostrarFormulario((anterior) => !anterior);
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
            <section className="intervencoes-gestao-acoes">
                <div>
                    <h2>Gestão de intervenções</h2>

                    <p>
                        Consulte as ações de acompanhamento e registre novas
                        intervenções escolares.
                    </p>
                </div>

                <button
                    type="button"
                    className="intervencoes-gestao-botao"
                    onClick={alternarFormulario}
                    aria-expanded={mostrarFormulario}
                    aria-controls="intervencoes-gestao-formulario"
                >
                    {mostrarFormulario
                        ? "Fechar cadastro"
                        : "+ Registrar intervenção"}
                </button>
            </section>

            {/* ======================================
          FORMULÁRIO DE CADASTRO
      ====================================== */}

            {mostrarFormulario && (
                <div id="intervencoes-gestao-formulario">
                    <FormularioIntervencao
                        token={token}
                        onCadastroRealizado={atualizarListagem}
                    />
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
