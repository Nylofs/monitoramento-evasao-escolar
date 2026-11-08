
import os

from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt

from dotenv import load_dotenv
from jwt.exceptions import InvalidTokenError


# Localiza o .env dentro da pasta backend
BASE_DIR = Path(__file__).resolve().parents[2]

load_dotenv(BASE_DIR / ".env")


# Configurações do JWT
SECRET_KEY = os.getenv("JWT_SECRET_KEY")

ALGORITHM = "HS256"

EXPIRE_MINUTES = int(
    os.getenv("JWT_EXPIRE_MINUTES", "30")
)


# Validação das configurações
if not SECRET_KEY or len(SECRET_KEY) < 32:
    raise ValueError(
        "JWT_SECRET_KEY ausente ou muito curta."
    )

if EXPIRE_MINUTES <= 0:
    raise ValueError(
        "JWT_EXPIRE_MINUTES deve ser positivo."
    )


def criar_token_acesso(usuario_id: int) -> str:
    """
    Gera um token JWT para o usuário.
    """

    agora = datetime.now(timezone.utc)

    expiracao = agora + timedelta(
        minutes=EXPIRE_MINUTES
    )

    dados = {
        "sub": str(usuario_id),
        "iat": agora,
        "exp": expiracao
    }

    token = jwt.encode(
        dados,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token


def verificar_token(token: str) -> int | None:
    """
    Valida o token e retorna o ID do usuário.

    Retorna None quando o token é inválido
    ou está expirado.
    """

    try:
        dados = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={"require": ["sub", "iat", "exp"]}
        )

        usuario_id = dados.get("sub")

        if not isinstance(usuario_id, str):
            return None

        if not usuario_id.isdecimal():
            return None

        return int(usuario_id)

    except (InvalidTokenError, ValueError):
        return None
