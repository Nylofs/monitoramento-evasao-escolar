import { useState } from "react";

// ============================================
// PÁGINAS PRINCIPAIS
// ============================================

import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";

// ============================================
// GESTÃO DE ESCOLAS
// ============================================

import EscolasGestao from "./pages/EscolasGestao";

// ============================================
// GESTÃO DE TURMAS
// ============================================

import TurmasGestao from "./pages/TurmasGestao";

// ============================================
// GESTÃO DE ALUNOS
// ============================================

import AlunosGestao from "./pages/AlunosGestao";

// ============================================
// GESTÃO DE FREQUÊNCIAS
// ============================================

import FrequenciasGestao from "./pages/FrequenciasGestao";

// ============================================
// INDICADORES
// ============================================

import Indicadores from "./pages/Indicadores";

// ============================================
// GESTÃO DE ALERTAS
// ETAPA 15 - PARTE 31
// ============================================

import AlertasGestao from "./pages/AlertasGestao";

// ============================================
// GESTÃO DE INTERVENÇÕES
// ============================================

import IntervencoesGestao from "./pages/IntervencoesGestao";

// ============================================
// COMPONENTES DE ESTRUTURA
// ============================================

import Modulo from "./pages/Modulo";
import MainLayout from "./components/MainLayout";

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function App() {
    // ==========================================
    // CONTROLE DE SESSÃO
    //
    // O token permanece na memória do React.
    // ==========================================

    const [sessao, setSessao] = useState(null);

    // ==========================================
    // CONTROLE DE NAVEGAÇÃO
    // ==========================================

    const [paginaAtual, setPaginaAtual] = useState("inicio");

    // ==========================================
    // LOGIN
    // ==========================================

    function realizarLogin(dados) {
        setSessao({
            matricula: dados.matricula,
            accessToken: dados.accessToken,
        });

        setPaginaAtual("inicio");
    }

    // ==========================================
    // LOGOUT
    // ==========================================

    function sair() {
        setSessao(null);

        setPaginaAtual("inicio");
    }

    // ==========================================
    // NAVEGAÇÃO ENTRE MÓDULOS
    // ==========================================

    function navegar(idPagina) {
        setPaginaAtual(idPagina);
    }

    // ==========================================
    // VERIFICAR AUTENTICAÇÃO
    // ==========================================

    if (!sessao) {
        return <Login onLogin={realizarLogin} />;
    }

    // ==========================================
    // DEFINIR CONTEÚDO DA PÁGINA
    // ==========================================

    let conteudo;

    // ==========================================
    // INÍCIO
    // ==========================================

    if (paginaAtual === "inicio") {
        conteudo = <Home matricula={sessao.matricula} onNavegar={navegar} />;

        // ==========================================
        // DASHBOARD
        // ==========================================
    } else if (paginaAtual === "dashboard") {
        conteudo = <Dashboard token={sessao.accessToken} />;

        // ==========================================
        // ESCOLAS
        // ==========================================
    } else if (paginaAtual === "escolas") {
        conteudo = <EscolasGestao token={sessao.accessToken} />;

        // ==========================================
        // TURMAS
        // ==========================================
    } else if (paginaAtual === "turmas") {
        conteudo = <TurmasGestao token={sessao.accessToken} />;

        // ==========================================
        // ALUNOS
        // ==========================================
    } else if (paginaAtual === "alunos") {
        conteudo = <AlunosGestao token={sessao.accessToken} />;

        // ==========================================
        // FREQUÊNCIAS
        // ==========================================
    } else if (paginaAtual === "frequencias") {
        conteudo = <FrequenciasGestao token={sessao.accessToken} />;

        // ==========================================
        // INDICADORES
        // ==========================================
    } else if (paginaAtual === "indicadores") {
        conteudo = <Indicadores token={sessao.accessToken} />;

        // ==========================================
        // ALERTAS
        // ETAPA 15 - PARTE 31
        //
        // O NOVO COMPONENTE REÚNE:
        // - Painel de triagem
        // - Consulta original de alertas
        // ==========================================
    } else if (paginaAtual === "alertas") {
        conteudo = <AlertasGestao token={sessao.accessToken} />;

        // ==========================================
        // INTERVENÇÕES
        // ==========================================
    } else if (paginaAtual === "intervencoes") {
        conteudo = <IntervencoesGestao token={sessao.accessToken} />;

        // ==========================================
        // PÁGINA NÃO RECONHECIDA
        // ==========================================
    } else {
        conteudo = (
            <Modulo
                paginaAtual={paginaAtual}
                onVoltar={() => navegar("inicio")}
            />
        );
    }

    // ==========================================
    // LAYOUT AUTENTICADO
    // ==========================================

    return (
        <MainLayout
            paginaAtual={paginaAtual}
            onNavegar={navegar}
            matricula={sessao.matricula}
            onSair={sair}
        >
            {conteudo}
        </MainLayout>
    );
}

// ============================================
// EXPORTAÇÃO
// ============================================

export default App;

