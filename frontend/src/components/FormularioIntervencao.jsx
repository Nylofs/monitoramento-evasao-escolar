import { useRef, useState } from "react";

import SeletorAluno from "./SeletorAluno";

import {
    criarIntervencao,
    ETAPAS_INTERVENCAO,
    STATUS_INTERVENCAO,
} from "../services/cadastroIntervencaoService";

// ============================================
// ETAPA 15 - PARTE 28
// FORMULÁRIO DE INTERVENÇÕES
// ============================================

// ============================================
// TRATAMENTO DE ERROS
// ============================================

function mensagemDeErro(erro) {
    const detalhe = erro.detalhes?.detail;

    if (erro.status === 401) {
        return "Sessão inválida ou expirada. " + "Faça login novamente.";
    }

    if (erro.status === 403) {
        return (
            "Você não possui permissão para " + "registrar esta intervenção."
        );
    }

    if (erro.status === 404) {
        return "Aluno ou recurso relacionado não encontrado.";
    }

    if (erro.status === 409) {
        return "O cadastro entrou em conflito com " + "uma regra do sistema.";
    }

    if (erro.status === 422) {
        if (Array.isArray(detalhe)) {
            return detalhe
                .map((item) => {
                    const campo = Array.isArray(item.loc)
                        ? item.loc.slice(1).join(".")
                        : "Campo";

                    return `${campo}: ${item.msg}`;
                })
                .join(" | ");
        }

        return (
            "Dados rejeitados pelo FastAPI. " + "Confira o schema no Swagger."
        );
    }

    if (erro.status === 400) {
        if (typeof detalhe === "string") {
            return detalhe;
        }

        return "Os dados não atendem a uma " + "regra do backend.";
    }

    return erro.message || "Não foi possível registrar a intervenção.";
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function FormularioIntervencao({ token, onCadastroRealizado }) {
    // ==========================================
    // CAMPOS
    // ==========================================

    const [alunoId, setAlunoId] = useState("");

    const [etapa, setEtapa] = useState("");

    const [status, setStatus] = useState("ABERTO");

    const [dataIntervencao, setDataIntervencao] = useState("");

    const [descricao, setDescricao] = useState("");

    const [resultado, setResultado] = useState("");

    const [responsavel, setResponsavel] = useState("");

    const [proximoContato, setProximoContato] = useState("");

    // ==========================================
    // ESTADOS DE ENVIO
    // ==========================================

    const [salvando, setSalvando] = useState(false);

    const [erro, setErro] = useState("");

    const [sucesso, setSucesso] = useState("");

    // Evita envios simultâneos.
    const envioPendente = useRef(false);

    // ==========================================
    // LIMPAR MENSAGENS
    // ==========================================

    function limparMensagens() {
        setErro("");
        setSucesso("");
    }

    // ==========================================
    // LIMPAR FORMULÁRIO
    // ==========================================

    function limparFormulario() {
        if (envioPendente.current) return;

        setAlunoId("");
        setEtapa("");
        setStatus("ABERTO");
        setDataIntervencao("");
        setDescricao("");
        setResultado("");
        setResponsavel("");
        setProximoContato("");

        limparMensagens();
    }

    // ==========================================
    // ENVIAR CADASTRO
    // ==========================================

    async function enviarCadastro(evento) {
        evento.preventDefault();

        if (envioPendente.current) return;

        limparMensagens();

        // ========================================
        // VALIDAÇÕES INICIAIS
        // ========================================

        if (!alunoId) {
            setErro("Selecione um aluno.");
            return;
        }

        if (!etapa) {
            setErro("Selecione a etapa da intervenção.");
            return;
        }

        if (!status) {
            setErro("Selecione o status.");
            return;
        }

        if (!dataIntervencao) {
            setErro("Informe a data da intervenção.");
            return;
        }

        if (!descricao.trim()) {
            setErro("Informe a descrição da intervenção.");
            return;
        }

        if (responsavel.trim().length < 3) {
            setErro("O responsável deve ter pelo " + "menos 3 caracteres.");
            return;
        }

        // ========================================
        // BLOQUEAR ENVIO REPETIDO
        // ========================================

        envioPendente.current = true;
        setSalvando(true);

        try {
            // ======================================
            // SERVICE - POST
            // ======================================

            const resposta = await criarIntervencao({
                alunoId,
                etapa,
                status,
                dataIntervencao,
                descricao,
                resultado,
                responsavel,
                proximoContato,
                token,
            });

            // ======================================
            // SUCESSO CONFIRMADO
            // ======================================

            setSucesso("Intervenção registrada com sucesso!");

            // Mantém o estudante selecionado,
            // mas limpa os dados do lançamento.

            setEtapa("");
            setStatus("ABERTO");
            setDataIntervencao("");
            setDescricao("");
            setResultado("");
            setResponsavel("");
            setProximoContato("");

            // Atualiza a listagem.
            onCadastroRealizado?.(resposta);
        } catch (falha) {
            setErro(mensagemDeErro(falha));
        } finally {
            envioPendente.current = false;
            setSalvando(false);
        }
    }

    // ==========================================
    // INTERFACE
    // ==========================================

    return (
        <section
            className="cadastro-intervencao"
            aria-labelledby="cadastro-intervencao-titulo"
        >
            {/* ======================================
          CABEÇALHO
      ====================================== */}

            <div className="cadastro-intervencao-topo">
                <h2 id="cadastro-intervencao-titulo">Registrar intervenção</h2>

                <p>
                    Selecione o estudante e registre a ação de acompanhamento
                    escolar.
                </p>
            </div>

            <form onSubmit={enviarCadastro}>
                {/* ====================================
            ALUNO
        ==================================== */}

                <div className="cadastro-intervencao-aluno">
                    <SeletorAluno
                        token={token}
                        valor={alunoId}
                        onChange={(novoId) => {
                            if (envioPendente.current) return;

                            setAlunoId(novoId);
                            limparMensagens();
                        }}
                        disabled={salvando}
                    />
                </div>

                {/* ====================================
            CAMPOS EM DUAS COLUNAS
        ==================================== */}

                <div className="cadastro-intervencao-campos">
                    {/* ==================================
              ETAPA
          ================================== */}

                    <div className="cadastro-intervencao-campo">
                        <label htmlFor="intervencao-etapa">
                            Etapa da intervenção *
                        </label>

                        <select
                            id="intervencao-etapa"
                            value={etapa}
                            onChange={(evento) => {
                                setEtapa(evento.target.value);
                                limparMensagens();
                            }}
                            disabled={salvando}
                            required
                        >
                            <option value="">Selecione a etapa</option>

                            {ETAPAS_INTERVENCAO.map((item) => (
                                <option key={item.valor} value={item.valor}>
                                    {item.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* ==================================
              STATUS
          ================================== */}

                    <div className="cadastro-intervencao-campo">
                        <label htmlFor="intervencao-status">Status *</label>

                        <select
                            id="intervencao-status"
                            value={status}
                            onChange={(evento) => {
                                setStatus(evento.target.value);
                                limparMensagens();
                            }}
                            disabled={salvando}
                            required
                        >
                            {STATUS_INTERVENCAO.map((item) => (
                                <option key={item.valor} value={item.valor}>
                                    {item.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* ==================================
              DATA DA INTERVENÇÃO
          ================================== */}

                    <div className="cadastro-intervencao-campo">
                        <label htmlFor="intervencao-data">
                            Data da intervenção *
                        </label>

                        <input
                            id="intervencao-data"
                            type="date"
                            value={dataIntervencao}
                            onChange={(evento) => {
                                setDataIntervencao(evento.target.value);
                                limparMensagens();
                            }}
                            disabled={salvando}
                            required
                        />
                    </div>

                    {/* ==================================
              PRÓXIMO CONTATO - OPCIONAL
          ================================== */}

                    <div className="cadastro-intervencao-campo">
                        <label htmlFor="intervencao-proximo">
                            Próximo contato (opcional)
                        </label>

                        <input
                            id="intervencao-proximo"
                            type="date"
                            value={proximoContato}
                            onChange={(evento) => {
                                setProximoContato(evento.target.value);
                                limparMensagens();
                            }}
                            disabled={salvando}
                        />
                    </div>

                    {/* ==================================
              RESPONSÁVEL
          ================================== */}

                    <div className="cadastro-intervencao-campo">
                        <label htmlFor="intervencao-responsavel">
                            Responsável pela intervenção *
                        </label>

                        <input
                            id="intervencao-responsavel"
                            type="text"
                            value={responsavel}
                            onChange={(evento) => {
                                setResponsavel(evento.target.value);
                                limparMensagens();
                            }}
                            disabled={salvando}
                            placeholder="Nome do responsável"
                            minLength={3}
                            required
                        />

                        <small>Informe pelo menos 3 caracteres.</small>
                    </div>
                </div>

                {/* ====================================
            DESCRIÇÃO
        ==================================== */}

                <div className="cadastro-intervencao-campo cadastro-intervencao-descricao">
                    <label htmlFor="intervencao-descricao">
                        Descrição da intervenção *
                    </label>

                    <textarea
                        id="intervencao-descricao"
                        rows={5}
                        value={descricao}
                        onChange={(evento) => {
                            setDescricao(evento.target.value);
                            limparMensagens();
                        }}
                        disabled={salvando}
                        required
                        placeholder={
                            "Descreva a ação de acompanhamento " +
                            "realizada ou planejada."
                        }
                    />

                    <small>
                        Utilize informações objetivas e evite dados sensíveis
                        desnecessários.
                    </small>
                </div>

                {/* ====================================
            RESULTADO
        ==================================== */}

                <div className="cadastro-intervencao-campo cadastro-intervencao-descricao">
                    <label htmlFor="intervencao-resultado">
                        Resultado (opcional)
                    </label>

                    <textarea
                        id="intervencao-resultado"
                        rows={4}
                        value={resultado}
                        onChange={(evento) => {
                            setResultado(evento.target.value);
                            limparMensagens();
                        }}
                        disabled={salvando}
                        placeholder={
                            "Registre o resultado ou " +
                            "encaminhamento, se já houver."
                        }
                    />

                    <small>
                        Pode ser preenchido quando houver um resultado conhecido
                        da intervenção.
                    </small>
                </div>

                {/* ====================================
            ERROS
        ==================================== */}

                {erro && (
                    <p
                        className={
                            "cadastro-intervencao-mensagem " +
                            "cadastro-intervencao-mensagem--erro"
                        }
                        role="alert"
                    >
                        {erro}
                    </p>
                )}

                {/* ====================================
            SUCESSO
        ==================================== */}

                {sucesso && (
                    <p
                        className={
                            "cadastro-intervencao-mensagem " +
                            "cadastro-intervencao-mensagem--sucesso"
                        }
                        role="status"
                    >
                        {sucesso}
                    </p>
                )}

                {/* ====================================
            BOTÕES
        ==================================== */}

                <div className="cadastro-intervencao-acoes">
                    <button
                        type="submit"
                        className="cadastro-intervencao-botao-salvar"
                        disabled={salvando}
                    >
                        {salvando
                            ? "Registrando intervenção..."
                            : "Registrar intervenção"}
                    </button>

                    <button
                        type="button"
                        className="cadastro-intervencao-botao-limpar"
                        disabled={salvando}
                        onClick={limparFormulario}
                    >
                        Limpar formulário
                    </button>
                </div>
            </form>

            {/* ======================================
          INFORMAÇÕES
      ====================================== */}

            <p className="cadastro-intervencao-observacao">
                A intervenção será enviada ao FastAPI com autenticação JWT. O
                backend será responsável pelas permissões, validações e
                persistência no MySQL.
            </p>
        </section>
    );
}

export default FormularioIntervencao;
