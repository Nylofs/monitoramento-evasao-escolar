
from fastapi import HTTPException, status

from sqlalchemy.orm import Session

from app.models.usuario_model import Usuario

from app.views.frequencia_view import (
    FrequenciaCreate,
    FrequenciaUpdate,
    FrequenciaResponse
)

from app.services.frequencia_service import (
    registrar_frequencia,
    listar_frequencias,
    buscar_frequencia,
    atualizar_frequencia,
    FrequenciaNaoEncontradaError,
    AlunoInvalidoFrequenciaError,
    FrequenciaPermissaoError,
    FrequenciaConflitoError,
    FrequenciaDataInvalidaError
)


# ============================================
# TRATAMENTO DE ERROS DO SERVICE
# ============================================

def tratar_erro_frequencia(erro: Exception):
    """
    Converte exceções de negócio do Service
    em respostas HTTP do FastAPI.
    """

    if isinstance(erro, FrequenciaPermissaoError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(erro)
        ) from erro

    if isinstance(erro, FrequenciaNaoEncontradaError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(erro)
        ) from erro

    if isinstance(erro, AlunoInvalidoFrequenciaError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(erro)
        ) from erro

    if isinstance(erro, FrequenciaDataInvalidaError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(erro)
        ) from erro

    if isinstance(erro, FrequenciaConflitoError):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(erro)
        ) from erro

    # Exceções inesperadas não são ocultadas.
    raise erro


# ============================================
# CREATE - REGISTRAR FREQUÊNCIA
# ============================================

def registrar_frequencia_controller(
    dados: FrequenciaCreate,
    db: Session,
    usuario: Usuario
) -> FrequenciaResponse:

    try:
        frequencia = registrar_frequencia(
            db=db,
            dados=dados,
            usuario=usuario
        )

        return FrequenciaResponse.model_validate(
            frequencia
        )

    except (
        FrequenciaPermissaoError,
        AlunoInvalidoFrequenciaError,
        FrequenciaDataInvalidaError,
        FrequenciaConflitoError
    ) as erro:
        tratar_erro_frequencia(erro)


# ============================================
# READ - LISTAR FREQUÊNCIAS
# ============================================

def listar_frequencias_controller(
    db: Session,
    usuario: Usuario,
    aluno_id: int | None = None
) -> list[FrequenciaResponse]:

    try:
        frequencias = listar_frequencias(
            db=db,
            usuario=usuario,
            aluno_id=aluno_id
        )

        return [
            FrequenciaResponse.model_validate(
                frequencia
            )
            for frequencia in frequencias
        ]

    except FrequenciaPermissaoError as erro:
        tratar_erro_frequencia(erro)


# ============================================
# READ - BUSCAR FREQUÊNCIA POR ID
# ============================================

def buscar_frequencia_controller(
    frequencia_id: int,
    db: Session,
    usuario: Usuario
) -> FrequenciaResponse:

    try:
        frequencia = buscar_frequencia(
            db=db,
            frequencia_id=frequencia_id,
            usuario=usuario
        )

        return FrequenciaResponse.model_validate(
            frequencia
        )

    except (
        FrequenciaNaoEncontradaError,
        FrequenciaPermissaoError
    ) as erro:
        tratar_erro_frequencia(erro)


# ============================================
# UPDATE - CORRIGIR FREQUÊNCIA
# ============================================

def atualizar_frequencia_controller(
    frequencia_id: int,
    dados: FrequenciaUpdate,
    db: Session,
    usuario: Usuario
) -> FrequenciaResponse:

    try:
        frequencia = atualizar_frequencia(
            db=db,
            frequencia_id=frequencia_id,
            dados=dados,
            usuario=usuario
        )

        return FrequenciaResponse.model_validate(
            frequencia
        )

    except (
        FrequenciaNaoEncontradaError,
        AlunoInvalidoFrequenciaError,
        FrequenciaPermissaoError,
        FrequenciaConflitoError,
        FrequenciaDataInvalidaError
    ) as erro:
        tratar_erro_frequencia(erro)
