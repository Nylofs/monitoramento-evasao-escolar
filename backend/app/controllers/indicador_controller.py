
from datetime import date

from fastapi import HTTPException, status

from sqlalchemy.orm import Session

from app.models.usuario_model import Usuario

from app.views.indicador_view import (
    IndicadorAlunoResponse,
    IndicadorTurmaResponse
)

from app.services.indicador_service import (
    obter_indicador_aluno,
    obter_indicador_turma,
    IndicadorNaoEncontradoError,
    IndicadorPermissaoError,
    IndicadorPeriodoInvalidoError
)


# ============================================
# TRATAMENTO DOS ERROS DO SERVICE
# ============================================

def tratar_erro_indicador(erro: Exception) -> None:
    """
    Converte exceções de negócio do Service
    em respostas HTTP do FastAPI.
    """

    if isinstance(erro, IndicadorPermissaoError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(erro)
        ) from erro

    if isinstance(erro, IndicadorNaoEncontradoError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(erro)
        ) from erro

    if isinstance(erro, IndicadorPeriodoInvalidoError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(erro)
        ) from erro

    # Não ocultamos erros desconhecidos.
    raise erro


# ============================================
# READ - INDICADORES DE UM ALUNO
# ============================================

def obter_indicador_aluno_controller(
    aluno_id: int,
    db: Session,
    usuario: Usuario,
    data_inicio: date | None = None,
    data_fim: date | None = None
) -> IndicadorAlunoResponse:
    """
    Coordena o cálculo dos indicadores
    individuais de frequência de um aluno.
    """

    try:
        indicador = obter_indicador_aluno(
            db=db,
            aluno_id=aluno_id,
            usuario=usuario,
            data_inicio=data_inicio,
            data_fim=data_fim
        )

        return IndicadorAlunoResponse.model_validate(
            indicador
        )

    except (
        IndicadorNaoEncontradoError,
        IndicadorPermissaoError,
        IndicadorPeriodoInvalidoError
    ) as erro:
        tratar_erro_indicador(erro)


# ============================================
# READ - INDICADORES DE UMA TURMA
# ============================================

def obter_indicador_turma_controller(
    turma_id: int,
    db: Session,
    usuario: Usuario,
    data_inicio: date | None = None,
    data_fim: date | None = None
) -> IndicadorTurmaResponse:
    """
    Coordena o cálculo dos indicadores
    de frequência dos alunos de uma turma.
    """

    try:
        indicador = obter_indicador_turma(
            db=db,
            turma_id=turma_id,
            usuario=usuario,
            data_inicio=data_inicio,
            data_fim=data_fim
        )

        return IndicadorTurmaResponse.model_validate(
            indicador
        )

    except (
        IndicadorNaoEncontradoError,
        IndicadorPermissaoError,
        IndicadorPeriodoInvalidoError
    ) as erro:
        tratar_erro_indicador(erro)
