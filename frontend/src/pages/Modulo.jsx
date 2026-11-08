import { buscarItemMenu } from "../config/menu";

// ============================================
// PÁGINA TEMPORÁRIA DOS MÓDULOS
// ============================================

function Modulo({ paginaAtual, onVoltar }) {
    const modulo = buscarItemMenu(paginaAtual);

    if (!modulo) {
        return (
            <section className="modulo-pagina">
                <h2>Página não encontrada</h2>

                <p>O módulo solicitado não está disponível na navegação.</p>

                <button
                    type="button"
                    className="modulo-voltar"
                    onClick={onVoltar}
                >
                    Voltar ao início
                </button>
            </section>
        );
    }

    return (
        <section className="modulo-pagina">
            <div className="modulo-conteudo">
                <span className="modulo-icone-grande" aria-hidden="true">
                    {modulo.icone}
                </span>

                <span className="modulo-etiqueta">MÓDULO DO SISTEMA</span>

                <h2>{modulo.titulo}</h2>

                <p>{modulo.descricao}</p>

                <div className="modulo-aviso">
                    <strong>Estrutura de navegação concluída</strong>

                    <p>
                        Esta página já está integrada ao menu principal. As
                        funcionalidades do módulo serão implementadas nas
                        próximas etapas com os dados da API FastAPI.
                    </p>
                </div>

                <button
                    type="button"
                    className="modulo-voltar"
                    onClick={onVoltar}
                >
                    ← Voltar ao início
                </button>
            </div>
        </section>
    );
}

export default Modulo;
