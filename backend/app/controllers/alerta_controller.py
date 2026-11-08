
from datetime import date
import logging

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

# ============================================
# IMPORTAÇÃO DO MODEL DE USUÁRIO
# ============================================

from app.models.usuario_model import Usuario


# ============================================
# IMPORTAÇÃO DOS SCHEMAS DE RESPOSTA
# ============================================

from app.views.alerta_view import (
    AlertaAlunoResponse,
    AlertaTurmaResponse
)


# ============================================
# IMPORTAÇÃO DAS FUNÇÕES DO SERVICE
# ============================================

from app.services.alerta_service import (
    gerar_alerta_aluno,
    gerar_alertas_turma,
    AlertaConfiguracaoInvalidaError
)


# ============================================
# IMPORTAÇÃO DAS EXCEÇÕES DOS INDICADORES
# ============================================

from app.services.indicador_service import (
    IndicadorNaoEncontradoError,
    IndicadorPermissaoError,
    IndicadorPeriodoInvalidoError
)


# ============================================
# CONFIGURAÇÃO DO LOGGER
# ============================================

logger = logging.getLogger(__name__)


# ============================================
# TRATAMENTO DE ERROS DO SERVICE
# ============================================

def tratar_erro_alerta(erro: Exception) -> None:
    """
    Converte exceções de negócio em
    respostas HTTP apropriadas.

    Não expõe detalhes internos de
    configuração ao usuário da API.
    """

    # ----------------------------------------
    # ERRO 403 - ACESSO NEGADO
    # ----------------------------------------

    if isinstance(erro, IndicadorPermissaoError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(erro)
        ) from erro

    # ----------------------------------------
    # ERRO 404 - RECURSO NÃO ENCONTRADO
    # ----------------------------------------

    if isinstance(erro, IndicadorNaoEncontradoError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(erro)
        ) from erro

    # ----------------------------------------
    # ERRO 400 - PERÍODO INVÁLIDO
    # ----------------------------------------

    if isinstance(erro, IndicadorPeriodoInvalidoError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(erro)
        ) from erro

    # ----------------------------------------
    # ERRO 500 - CONFIGURAÇÃO INTERNA INVÁLIDA
    # ----------------------------------------

    if isinstance(
        erro,
        AlertaConfiguracaoInvalidaError
    ):

        logger.error(
            "Configuração inválida dos alertas: %s",
            erro
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Não foi possível processar os alertas "
                "devido a uma configuração interna."
            )
        ) from erro

    # ----------------------------------------
    # OUTROS ERROS
    # ----------------------------------------

    raise erro


# ============================================
# READ - GERAR ALERTA INDIVIDUAL
# ============================================

def gerar_alerta_aluno_controller(
    aluno_id: int,
    db: Session,
    usuario: Usuario,
    data_inicio: date | None = None,
    data_fim: date | None = None
) -> AlertaAlunoResponse:
    """
    Coordena a geração da classificação
    operacional de um aluno.

    Reutiliza o Service de Alertas.
    """

    try:
        alerta = gerar_alerta_aluno(
            db=db,
            aluno_id=aluno_id,
            usuario=usuario,
            data_inicio=data_inicio,
            data_fim=data_fim
        )

        return AlertaAlunoResponse.model_validate(
            alerta
        )

    except (
        IndicadorNaoEncontradoError,
        IndicadorPermissaoError,
        IndicadorPeriodoInvalidoError,
        AlertaConfiguracaoInvalidaError
    ) as erro:
        tratar_erro_alerta(erro)


# ============================================
# READ - GERAR RESUMO DOS ALERTAS DA TURMA
# ============================================

def gerar_alertas_turma_controller(
    turma_id: int,
    db: Session,
    usuario: Usuario,
    data_inicio: date | None = None,
    data_fim: date | None = None
) -> AlertaTurmaResponse:
    """
    Coordena a geração do resumo de alertas
    dos alunos ativos de uma turma.

    A escola do usuário é verificada
    pelo Service.
    """

    try:
        resumo = gerar_alertas_turma(
            db=db,
            turma_id=turma_id,
            usuario=usuario,
            data_inicio=data_inicio,
            data_fim=data_fim
        )

        return AlertaTurmaResponse.model_validate(
            resumo
        )

    except (
        IndicadorNaoEncontradoError,
        IndicadorPermissaoError,
        IndicadorPeriodoInvalidoError,
        AlertaConfiguracaoInvalidaError
    ) as erro:
        tratar_erro_alerta(erro)
