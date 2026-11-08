
from fastapi import HTTPException, status

from sqlalchemy.orm import Session

from app.models.usuario_model import Usuario

from app.views.aluno_view import (
    AlunoCreate,
    AlunoUpdate,
    AlunoResponse
)

from app.services.aluno_service import (
    cadastrar_aluno,
    listar_alunos,
    buscar_aluno,
    atualizar_aluno,
    desativar_aluno,
    AlunoNaoEncontradoError,
    TurmaInvalidaError,
    AlunoPermissaoError,
    AlunoConflitoError
)


# ============================================
# TRATAMENTO DOS ERROS DO SERVICE
# ============================================

def tratar_erro_aluno(erro: Exception):
    """
    Converte as exceções de negócio do
    Service em respostas HTTP do FastAPI.
    """

    if isinstance(erro, AlunoPermissaoError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(erro)
        ) from erro

    if isinstance(erro, AlunoNaoEncontradoError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(erro)
        ) from erro

    if isinstance(erro, TurmaInvalidaError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(erro)
        ) from erro

    if isinstance(erro, AlunoConflitoError):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(erro)
        ) from erro

    # Mantém erros inesperados visíveis
    raise erro


# ============================================
# CREATE - CADASTRAR ALUNO
# ============================================

def criar_aluno_controller(
    dados: AlunoCreate,
    db: Session,
    usuario: Usuario
) -> AlunoResponse:

    try:
        aluno = cadastrar_aluno(
            db=db,
            dados=dados,
            usuario=usuario
        )

        return AlunoResponse.model_validate(aluno)

    except (
        AlunoPermissaoError,
        TurmaInvalidaError,
        AlunoConflitoError
    ) as erro:
        tratar_erro_aluno(erro)


# ============================================
# READ - LISTAR ALUNOS
# ============================================

def listar_alunos_controller(
    db: Session,
    usuario: Usuario
) -> list[AlunoResponse]:

    try:
        alunos = listar_alunos(
            db=db,
            usuario=usuario
        )

        return [
            AlunoResponse.model_validate(aluno)
            for aluno in alunos
        ]

    except AlunoPermissaoError as erro:
        tratar_erro_aluno(erro)


# ============================================
# READ - BUSCAR ALUNO POR ID
# ============================================

def buscar_aluno_controller(
    aluno_id: int,
    db: Session,
    usuario: Usuario
) -> AlunoResponse:

    try:
        aluno = buscar_aluno(
            db=db,
            aluno_id=aluno_id,
            usuario=usuario
        )

        return AlunoResponse.model_validate(aluno)

    except (
        AlunoNaoEncontradoError,
        AlunoPermissaoError
    ) as erro:
        tratar_erro_aluno(erro)


# ============================================
# UPDATE - ATUALIZAR ALUNO
# ============================================

def atualizar_aluno_controller(
    aluno_id: int,
    dados: AlunoUpdate,
    db: Session,
    usuario: Usuario
) -> AlunoResponse:

    try:
        aluno = atualizar_aluno(
            db=db,
            aluno_id=aluno_id,
            dados=dados,
            usuario=usuario
        )

        return AlunoResponse.model_validate(aluno)

    except (
        AlunoNaoEncontradoError,
        AlunoPermissaoError,
        TurmaInvalidaError,
        AlunoConflitoError
    ) as erro:
        tratar_erro_aluno(erro)


# ============================================
# DELETE - DESATIVAR ALUNO
# ============================================

def desativar_aluno_controller(
    aluno_id: int,
    db: Session,
    usuario: Usuario
) -> AlunoResponse:

    try:
        aluno = desativar_aluno(
            db=db,
            aluno_id=aluno_id,
            usuario=usuario
        )

        return AlunoResponse.model_validate(aluno)

    except (
        AlunoNaoEncontradoError,
        AlunoPermissaoError,
        TurmaInvalidaError
    ) as erro:
        tratar_erro_aluno(erro)
