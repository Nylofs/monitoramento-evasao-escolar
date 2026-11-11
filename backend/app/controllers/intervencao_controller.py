
from fastapi import HTTPException, status

from sqlalchemy.orm import Session

from app.models.usuario_model import Usuario

from app.views.intervencao_view import (
    IntervencaoCreate,
    IntervencaoUpdate,
    IntervencaoResponse
)

from app.services.intervencao_service import (
    cadastrar_intervencao,
    listar_intervencoes,
    buscar_intervencao,
    atualizar_intervencao,
    excluir_intervencao,
    IntervencaoNaoEncontradaError,
    AlunoInvalidoIntervencaoError,
    IntervencaoPermissaoError,
    IntervencaoConflitoError,
    IntervencaoDataInvalidaError
)


# ============================================
# TRATAMENTO DOS ERROS DO SERVICE
# ============================================

def tratar_erro_intervencao(erro: Exception):
    """
    Converte exceções de negócio do Service
    em respostas HTTP do FastAPI.
    """

    if isinstance(erro, IntervencaoPermissaoError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(erro)
        ) from erro

    if isinstance(erro, IntervencaoNaoEncontradaError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(erro)
        ) from erro

    if isinstance(erro, AlunoInvalidoIntervencaoError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(erro)
        ) from erro

    if isinstance(erro, IntervencaoDataInvalidaError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(erro)
        ) from erro

    if isinstance(erro, IntervencaoConflitoError):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(erro)
        ) from erro

    # Erros inesperados continuam visíveis.
    raise erro


# ============================================
# CREATE - CADASTRAR INTERVENÇÃO
# ============================================

def criar_intervencao_controller(
    dados: IntervencaoCreate,
    db: Session,
    usuario: Usuario
) -> IntervencaoResponse:

    try:
        intervencao = cadastrar_intervencao(
            db=db,
            dados=dados,
            usuario=usuario
        )

        return IntervencaoResponse.model_validate(
            intervencao
        )

    except (
        IntervencaoPermissaoError,
        AlunoInvalidoIntervencaoError,
        IntervencaoDataInvalidaError,
        IntervencaoConflitoError
    ) as erro:
        tratar_erro_intervencao(erro)


# ============================================
# READ - LISTAR INTERVENÇÕES
# ============================================

def listar_intervencoes_controller(
    db: Session,
    usuario: Usuario,
    aluno_id: int | None = None
) -> list[IntervencaoResponse]:

    try:
        intervencoes = listar_intervencoes(
            db=db,
            usuario=usuario,
            aluno_id=aluno_id
        )

        return [
            IntervencaoResponse.model_validate(
                intervencao
            )
            for intervencao in intervencoes
        ]

    except IntervencaoPermissaoError as erro:
        tratar_erro_intervencao(erro)


# ============================================
# READ - BUSCAR INTERVENÇÃO POR ID
# ============================================

def buscar_intervencao_controller(
    intervencao_id: int,
    db: Session,
    usuario: Usuario
) -> IntervencaoResponse:

    try:
        intervencao = buscar_intervencao(
            db=db,
            intervencao_id=intervencao_id,
            usuario=usuario
        )

        return IntervencaoResponse.model_validate(
            intervencao
        )

    except (
        IntervencaoNaoEncontradaError,
        IntervencaoPermissaoError
    ) as erro:
        tratar_erro_intervencao(erro)


# ============================================
# UPDATE - ATUALIZAR INTERVENÇÃO
# ============================================

def atualizar_intervencao_controller(
    intervencao_id: int,
    dados: IntervencaoUpdate,
    db: Session,
    usuario: Usuario
) -> IntervencaoResponse:

    try:
        intervencao = atualizar_intervencao(
            db=db,
            intervencao_id=intervencao_id,
            dados=dados,
            usuario=usuario
        )

        return IntervencaoResponse.model_validate(
            intervencao
        )

    except (
        IntervencaoNaoEncontradaError,
        AlunoInvalidoIntervencaoError,
        IntervencaoPermissaoError,
        IntervencaoConflitoError,
        IntervencaoDataInvalidaError
    ) as erro:
        tratar_erro_intervencao(erro)


# ============================================
# DELETE - EXCLUIR INTERVENÇÃO
# ============================================

def excluir_intervencao_controller(
    intervencao_id: int,
    db: Session,
    usuario: Usuario
) -> None:
    """Aciona o Service e converte erros de exclusão em HTTP."""

    try:
        excluir_intervencao(
            db=db,
            intervencao_id=intervencao_id,
            usuario=usuario
        )
    except (
        IntervencaoNaoEncontradaError,
        IntervencaoPermissaoError,
        IntervencaoConflitoError
    ) as erro:
        tratar_erro_intervencao(erro)
