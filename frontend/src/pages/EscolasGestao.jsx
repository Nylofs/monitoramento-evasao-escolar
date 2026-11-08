import { useState } from "react";

import Escolas from "./Escolas";

import FormularioEscola from "../components/FormularioEscola";

import FormularioEdicaoEscola from "../components/FormularioEdicaoEscola";

import ExclusaoEscola from "../components/ExclusaoEscola";

// ============================================
// GESTÃO DE ESCOLAS
// ============================================

function EscolasGestao({ token }) {
    // ==========================================
    // MODO DO FORMULÁRIO
    // null | cadastro | edicao | exclusao
    // ==========================================

    const [modoFormulario, setModoFormulario] = useState(null);

    // ==========================================
    // VERSÃO DA LISTAGEM
    // ==========================================

    const [versaoLista, setVersaoLista] = useState(0);

    // ==========================================
    // ABRIR OU FECHAR MODO
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
    // ATUALIZAR LISTAGEM
    // ==========================================

    function atualizarListagem() {
        setVersaoLista((anterior) => anterior + 1);
    }

    // ==========================================
    // INTERFACE
    // ==========================================

    return (
        <div className="escolas-gestao">
            {/* ======================================
          CABEÇALHO
      ====================================== */}

            <section className="escolas-gestao-acoes">
                <div>
                    <h2>Gestão de escolas</h2>

                    <p>
                        Consulte, cadastre, edite e exclua instituições conforme
                        suas permissões.
                    </p>
                </div>

                <div className="escolas-gestao-botoes">
                    {/* CADASTRAR */}

                    <button
                        type="button"
                        className="escolas-gestao-botao"
                        aria-expanded={modoFormulario === "cadastro"}
                        aria-controls="escolas-gestao-formulario"
                        onClick={() => alterarModo("cadastro")}
                    >
                        {modoFormulario === "cadastro"
                            ? "Fechar cadastro"
                            : "+ Nova escola"}
                    </button>

                    {/* EDITAR */}

                    <button
                        type="button"
                        className={
                            "escolas-gestao-botao " +
                            "escolas-gestao-botao--secundario"
                        }
                        aria-expanded={modoFormulario === "edicao"}
                        aria-controls="escolas-gestao-formulario"
                        onClick={() => alterarModo("edicao")}
                    >
                        {modoFormulario === "edicao"
                            ? "Fechar edição"
                            : "Editar escola"}
                    </button>

                    {/* EXCLUIR */}

                    <button
                        type="button"
                        className={
                            "escolas-gestao-botao " +
                            "escolas-gestao-botao--perigo"
                        }
                        aria-expanded={modoFormulario === "exclusao"}
                        aria-controls="escolas-gestao-formulario"
                        onClick={() => alterarModo("exclusao")}
                    >
                        {modoFormulario === "exclusao"
                            ? "Fechar exclusão"
                            : "Excluir escola"}
                    </button>
                </div>
            </section>

            {/* ======================================
          FORMULÁRIOS
      ====================================== */}

            {modoFormulario !== null && (
                <div id="escolas-gestao-formulario">
                    {/* CADASTRO */}

                    {modoFormulario === "cadastro" && (
                        <FormularioEscola
                            token={token}
                            onCadastroRealizado={atualizarListagem}
                        />
                    )}

                    {/* EDIÇÃO */}

                    {modoFormulario === "edicao" && (
                        <FormularioEdicaoEscola
                            token={token}
                            onAtualizacaoRealizada={atualizarListagem}
                        />
                    )}

                    {/* EXCLUSÃO */}

                    {modoFormulario === "exclusao" && (
                        <ExclusaoEscola
                            token={token}
                            onExclusaoRealizada={atualizarListagem}
                        />
                    )}
                </div>
            )}

            {/* ======================================
          LISTAGEM EXISTENTE
      ====================================== */}

            <Escolas key={versaoLista} token={token} />
        </div>
    );
}

export default EscolasGestao;
