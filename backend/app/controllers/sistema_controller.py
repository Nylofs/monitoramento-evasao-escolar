
from fastapi import HTTPException

from app.services.sistema_service import verificar_banco


def consultar_status_banco():
    resultado = verificar_banco()

    if resultado["status"] == "erro":
        raise HTTPException(
            status_code=503,
            detail="Banco de dados indisponível"
        )

    return resultado
