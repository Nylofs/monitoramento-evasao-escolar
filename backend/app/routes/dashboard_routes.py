
from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    Path,
    Query,
    status
)

from sqlalchemy.orm import Session


# ============================================
# CONEXÃO COM O BANCO
# ============================================

from app.database.connection import get_db


# ============================================
# MODEL DO USUÁRIO
# ============================================

from app.models.usuario_model import Usuario


# ============================================
# AUTENTICAÇÃO JWT EXISTENTE
# ============================================

from app.routes.escola_routes import (
    obter_usuario_atual
)


# ============================================
# SCHEMA DE RESPOSTA DO DASHBOARD
# ============================================

from app.views.dashboard_view import (
    DashboardEscolaResponse
)


# ============================================
# CONTROLLER DO DASHBOARD
# ============================================

from app.controllers.dashboard_controller import (
    gerar_dashboard_escola_controller
)


# ============================================
# CONFIGURAÇÃO DO ROTEADOR
# ============================================

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard Escolar"]
)


# ============================================
# GET - DASHBOARD CONSOLIDADO DA ESCOLA
# ============================================

@router.get(
    "/escolas/{escola_id}",
    response_model=DashboardEscolaResponse,
    status_code=status.HTTP_200_OK,
    summary="Consultar Dashboard de uma escola",
    description=(
        "Retorna informações consolidadas "
        "sobre alunos, turmas, frequência, "
        "alertas e intervenções escolares. "
        "Os dados respeitam as permissões "
        "da escola do usuário autenticado."
    )
)
def consultar_dashboard_escola_route(
    escola_id: int = Path(
        gt=0,
        description="Identificador da escola"
    ),

    data_inicio: date | None = Query(
        default=None,
        description=(
            "Data inicial no formato AAAA-MM-DD"
        )
    ),

    data_fim: date | None = Query(
        default=None,
        description=(
            "Data final no formato AAAA-MM-DD"
        )
    ),

    db: Session = Depends(get_db),

    usuario: Usuario = Depends(
        obter_usuario_atual
    )
):

    return gerar_dashboard_escola_controller(
        escola_id=escola_id,
        db=db,
        usuario=usuario,
        data_inicio=data_inicio,
        data_fim=data_fim
    )
