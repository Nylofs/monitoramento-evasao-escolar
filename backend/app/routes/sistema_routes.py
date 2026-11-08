
from fastapi import APIRouter

from app.controllers.sistema_controller import (
    consultar_status_banco
)

router = APIRouter(
    prefix="/api/sistema",
    tags=["Sistema"]
)


@router.get("/banco")
def status_banco():
    return consultar_status_banco()
