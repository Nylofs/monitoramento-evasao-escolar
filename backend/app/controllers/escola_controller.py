
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.usuario_model import Usuario

from app.views.escola_view import (
    EscolaCreate,
    EscolaUpdate
)

from app.services.escola_service import (
    cadastrar_escola,
    listar_escolas,
    buscar_escola,
    atualizar_escola,
    desativar_escola,
    EscolaNaoEncontradaError,
    EscolaPermissaoError,
    EscolaConflitoError
)


def tratar_erro_escola(erro: Exception):
    """
    Converte erros do Service
    em respostas HTTP.
    """

    if isinstance(erro, EscolaPermissaoError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(erro)
        ) from erro

    if isinstance(erro, EscolaNaoEncontradaError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(erro)
        ) from erro

    if isinstance(erro, EscolaConflitoError):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(erro)
        ) from erro

    raise erro


def criar_escola_controller(
    dados: EscolaCreate,
    db: Session,
    usuario: Usuario
):
    try:
        return cadastrar_escola(
            db=db,
            dados=dados,
            usuario=usuario
        )

    except (
        EscolaPermissaoError,
        EscolaConflitoError
    ) as erro:
        tratar_erro_escola(erro)


def listar_escolas_controller(
    db: Session,
    usuario: Usuario
):
    try:
        return listar_escolas(
            db=db,
            usuario=usuario
        )

    except EscolaPermissaoError as erro:
        tratar_erro_escola(erro)


def buscar_escola_controller(
    escola_id: int,
    db: Session,
    usuario: Usuario
):
    try:
        return buscar_escola(
            db=db,
            escola_id=escola_id,
            usuario=usuario
        )

    except (
        EscolaPermissaoError,
        EscolaNaoEncontradaError
    ) as erro:
        tratar_erro_escola(erro)


def atualizar_escola_controller(
    escola_id: int,
    dados: EscolaUpdate,
    db: Session,
    usuario: Usuario
):
    try:
        return atualizar_escola(
            db=db,
            escola_id=escola_id,
            dados=dados,
            usuario=usuario
        )

    except (
        EscolaPermissaoError,
        EscolaNaoEncontradaError,
        EscolaConflitoError
    ) as erro:
        tratar_erro_escola(erro)


def desativar_escola_controller(
    escola_id: int,
    db: Session,
    usuario: Usuario
):
    try:
        return desativar_escola(
            db=db,
            escola_id=escola_id,
            usuario=usuario
        )

    except (
        EscolaPermissaoError,
        EscolaNaoEncontradaError
    ) as erro:
        tratar_erro_escola(erro)
