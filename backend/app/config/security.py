
from argon2 import PasswordHasher
from argon2.exceptions import (
    VerifyMismatchError,
    VerificationError,
    InvalidHashError
)


# Configuração do algoritmo Argon2id
password_hasher = PasswordHasher(
    time_cost=2,
    memory_cost=19456,
    parallelism=1,
    hash_len=32,
    salt_len=16
)


def gerar_hash_senha(senha: str) -> str:
    """
    Recebe uma senha e retorna
    seu hash seguro.
    """
    return password_hasher.hash(senha)


def verificar_senha(
    senha: str,
    senha_hash: str
) -> bool:
    """
    Compara uma senha informada
    com o hash armazenado.
    """
    try:
        return password_hasher.verify(
            senha_hash,
            senha
        )

    except (
        VerifyMismatchError,
        VerificationError,
        InvalidHashError
    ):
        return False
