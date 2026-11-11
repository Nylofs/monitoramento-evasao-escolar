import { useState } from "react";

import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";

import EscolasGestao from "./pages/EscolasGestao";
import TurmasGestao from "./pages/TurmasGestao";
import AlunosGestao from "./pages/AlunosGestao";
import FrequenciasGestao from "./pages/FrequenciasGestao";

import Indicadores from "./pages/Indicadores";
import Alertas from "./pages/Alertas";

import IntervencoesGestao from "./pages/IntervencoesGestao";

import Modulo from "./pages/Modulo";
import MainLayout from "./components/MainLayout";

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function App() {
    // ==========================================
    // SESSÃO EM MEMÓRIA
    // ==========================================

    const [sessao, setSessao] = useState(null);

    // ==========================================
    // NAVEGAÇÃO
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
    // NAVEGAR
    // ==========================================

    function navegar(idPagina) {
        setPaginaAtual(idPagina);
    }

    // ==========================================
    // LOGIN NÃO REALIZADO
    // ==========================================

    if (!sessao) {
        return <Login onLogin={realizarLogin} />;
    }

    // ==========================================
    // CONTEÚDO AUTENTICADO
    // ==========================================

    let conteudo;

    if (paginaAtual === "inicio") {
        conteudo = <Home matricula={sessao.matricula} onNavegar={navegar} />;
    } else if (paginaAtual === "dashboard") {
        conteudo = <Dashboard token={sessao.accessToken} />;
    } else if (paginaAtual === "escolas") {
        conteudo = <EscolasGestao token={sessao.accessToken} />;
    } else if (paginaAtual === "turmas") {
        conteudo = <TurmasGestao token={sessao.accessToken} />;
    } else if (paginaAtual === "alunos") {
        conteudo = <AlunosGestao token={sessao.accessToken} />;
    } else if (paginaAtual === "frequencias") {
        conteudo = <FrequenciasGestao token={sessao.accessToken} />;
    } else if (paginaAtual === "indicadores") {
        conteudo = <Indicadores token={sessao.accessToken} />;
    } else if (paginaAtual === "alertas") {
        conteudo = <Alertas token={sessao.accessToken} />;
    } else if (paginaAtual === "intervencoes") {
        conteudo = <IntervencoesGestao token={sessao.accessToken} />;
    } else {
        conteudo = (
            <Modulo
                paginaAtual={paginaAtual}
                onVoltar={() => navegar("inicio")}
            />
        );
    }

    // ==========================================
    // LAYOUT PRINCIPAL
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

export default App;

