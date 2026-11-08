
from fastapi import HTTPException, status

from sqlalchemy.orm import Session

from app.services.auth_service import (
    autenticar_usuario,
    buscar_usuario_por_id
)

from app.views.usuario_view import (
    LoginRequest,
    TokenResponse,
    UsuarioResponse
)


def realizar_login(
    dados: LoginRequest,
    db: Session
) -> TokenResponse:

    token = autenticar_usuario(
        db=db,
        matricula=dados.matricula,
        senha=dados.senha
    )

    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Matrícula ou senha inválida",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return TokenResponse(
        access_token=token,
        token_type="bearer"
    )


def consultar_usuario_atual(
    usuario_id: int,
    db: Session
) -> UsuarioResponse:

    usuario = buscar_usuario_por_id(
        db=db,
        usuario_id=usuario_id
    )

    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não autorizado",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return UsuarioResponse.model_validate(usuario)
