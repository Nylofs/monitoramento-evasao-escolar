
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials
)

from sqlalchemy.orm import Session

from app.database.connection import get_db

from app.config.token import verificar_token

from app.controllers.auth_controller import (
    realizar_login,
    consultar_usuario_atual
)

from app.views.usuario_view import (
    LoginRequest,
    TokenResponse,
    UsuarioResponse
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Autenticação"]
)

seguranca = HTTPBearer()


def obter_usuario_id(
    credenciais: Annotated[
        HTTPAuthorizationCredentials,
        Depends(seguranca)
    ]
) -> int:

    token = credenciais.credentials

    usuario_id = verificar_token(token)

    if usuario_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return usuario_id


@router.post(
    "/login",
    response_model=TokenResponse
)
def login(
    dados: LoginRequest,
    db: Session = Depends(get_db)
):
    return realizar_login(
        dados=dados,
        db=db
    )


@router.get(
    "/me",
    response_model=UsuarioResponse
)
def meu_usuario(
    usuario_id: int = Depends(obter_usuario_id),
    db: Session = Depends(get_db)
):
    return consultar_usuario_atual(
        usuario_id=usuario_id,
        db=db
    )
