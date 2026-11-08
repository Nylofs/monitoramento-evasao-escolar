import { useEffect, useState } from "react";

import { consultarSistema } from "../services/sistemaService";

// ============================================
// COMPONENTE DE ESTADO DA API
// ============================================

function ApiStatus() {
    const [estado, setEstado] = useState("carregando");

    const [mensagem, setMensagem] = useState(
        "Verificando comunicação com o FastAPI...",
    );

    const [versao, setVersao] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        async function verificarConexao() {
            try {
                const dados = await consultarSistema(controller.signal);

                setEstado("online");

                setMensagem(dados.mensagem || "API disponível.");

                setVersao(dados.versao || null);
            } catch (erro) {
                if (erro.name === "AbortError") {
                    return;
                }

                setEstado("offline");

                setMensagem(erro.message);

                setVersao(null);
            }
        }

        verificarConexao();

        return () => {
            controller.abort();
        };
    }, []);

    return (
        <section
            className={`api-status api-status--${estado}`}
            aria-live="polite"
        >
            <div className="api-status-conteudo">
                <h2>Conexão com o Backend</h2>

                <p>{mensagem}</p>

                {versao && <small>Versão da API: {versao}</small>}
            </div>

            <span className="api-status-etiqueta">
                {estado === "carregando" && "Verificando"}

                {estado === "online" && "API online"}

                {estado === "offline" && "API indisponível"}
            </span>
        </section>
    );
}

export default ApiStatus;
