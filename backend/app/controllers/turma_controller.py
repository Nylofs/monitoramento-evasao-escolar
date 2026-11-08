
from fastapi import HTTPException, status

from sqlalchemy.orm import Session

from app.models.usuario_model import Usuario

from app.views.turma_view import (
    TurmaCreate,
    TurmaUpdate,
    TurmaResponse
)

from app.services.turma_service import (
    cadastrar_turma,
    listar_turmas,
    buscar_turma,
    atualizar_turma,
    desativar_turma,
    TurmaNaoEncontradaError,
    EscolaInvalidaError,
    TurmaPermissaoError,
    TurmaConflitoError
)


# ============================================
# TRATAMENTO DOS ERROS DO SERVICE
# ============================================

def tratar_erro_turma(erro: Exception):
    """
    Converte exceções de negócio do Service
    em respostas HTTP do FastAPI.
    """

    if isinstance(erro, TurmaPermissaoError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(erro)
        ) from erro

    if isinstance(erro, TurmaNaoEncontradaError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(erro)
        ) from erro

    if isinstance(erro, EscolaInvalidaError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(erro)
        ) from erro

    if isinstance(erro, TurmaConflitoError):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(erro)
        ) from erro

    # Erros desconhecidos não serão ocultados
    raise erro


# ============================================
# CREATE - CADASTRAR TURMA
# ============================================

def criar_turma_controller(
    dados: TurmaCreate,
    db: Session,
    usuario: Usuario
) -> TurmaResponse:

    try:
        turma = cadastrar_turma(
            db=db,
            dados=dados,
            usuario=usuario
        )

        return TurmaResponse.model_validate(turma)

    except (
        TurmaPermissaoError,
        EscolaInvalidaError,
        TurmaConflitoError
    ) as erro:
        tratar_erro_turma(erro)


# ============================================
# READ - LISTAR TURMAS
# ============================================

def listar_turmas_controller(
    db: Session,
    usuario: Usuario
) -> list[TurmaResponse]:

    try:
        turmas = listar_turmas(
            db=db,
            usuario=usuario
        )

        return [
            TurmaResponse.model_validate(turma)
            for turma in turmas
        ]

    except (
        TurmaPermissaoError,
        EscolaInvalidaError
    ) as erro:
        tratar_erro_turma(erro)


# ============================================
# READ - BUSCAR TURMA POR ID
# ============================================

def buscar_turma_controller(
    turma_id: int,
    db: Session,
    usuario: Usuario
) -> TurmaResponse:

    try:
        turma = buscar_turma(
            db=db,
            turma_id=turma_id,
            usuario=usuario
        )

        return TurmaResponse.model_validate(turma)

    except (
        TurmaNaoEncontradaError,
        TurmaPermissaoError,
        EscolaInvalidaError
    ) as erro:
        tratar_erro_turma(erro)


# ============================================
# UPDATE - ATUALIZAR TURMA
# ============================================

def atualizar_turma_controller(
    turma_id: int,
    dados: TurmaUpdate,
    db: Session,
    usuario: Usuario
) -> TurmaResponse:

    try:
        turma = atualizar_turma(
            db=db,
            turma_id=turma_id,
            dados=dados,
            usuario=usuario
        )

        return TurmaResponse.model_validate(turma)

    except (
        TurmaNaoEncontradaError,
        TurmaPermissaoError,
        EscolaInvalidaError,
        TurmaConflitoError
    ) as erro:
        tratar_erro_turma(erro)


# ============================================
# DELETE - DESATIVAR TURMA
# ============================================

def desativar_turma_controller(
    turma_id: int,
    db: Session,
    usuario: Usuario
) -> TurmaResponse:

    try:
        turma = desativar_turma(
            db=db,
            turma_id=turma_id,
            usuario=usuario
        )

        return TurmaResponse.model_validate(turma)

    except (
        TurmaNaoEncontradaError,
        TurmaPermissaoError,
        EscolaInvalidaError
    ) as erro:
        tratar_erro_turma(erro)
