
from datetime import date
import logging

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

# ============================================
# MODEL DO USUÁRIO
# ============================================

from app.models.usuario_model import Usuario


# ============================================
# SCHEMA DE RESPOSTA DO DASHBOARD
# ============================================

from app.views.dashboard_view import (
    DashboardEscolaResponse
)


# ============================================
# SERVICE DO DASHBOARD
# ============================================

from app.services.dashboard_service import (
    gerar_dashboard_escola
)


# ============================================
# EXCEÇÕES DO SERVICE DE INDICADORES
# ============================================

from app.services.indicador_service import (
    IndicadorNaoEncontradoError,
    IndicadorPermissaoError,
    IndicadorPeriodoInvalidoError
)


# ============================================
# EXCEÇÃO DO SERVICE DE ALERTAS
# ============================================

from app.services.alerta_service import (
    AlertaConfiguracaoInvalidaError
)


# ============================================
# LOGGER DO CONTROLLER
# ============================================

logger = logging.getLogger(__name__)


# ============================================
# TRATAMENTO DE ERROS DO DASHBOARD
# ============================================

def tratar_erro_dashboard(erro: Exception) -> None:
    """
    Converte exceções dos Services
    em respostas HTTP padronizadas.

    Problemas internos não devem expor
    detalhes de configuração ao cliente.
    """

    # ----------------------------------------
    # ERRO 403 - ACESSO NEGADO
    # ----------------------------------------

    if isinstance(erro, IndicadorPermissaoError):

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(erro)
        ) from erro

    # ----------------------------------------
    # ERRO 404 - ESCOLA NÃO ENCONTRADA
    # ----------------------------------------

    if isinstance(erro, IndicadorNaoEncontradoError):

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(erro)
        ) from erro

    # ----------------------------------------
    # ERRO 400 - PERÍODO INVÁLIDO
    # ----------------------------------------

    if isinstance(erro, IndicadorPeriodoInvalidoError):

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(erro)
        ) from erro

    # ----------------------------------------
    # ERRO 500 - CONFIGURAÇÃO DE ALERTAS
    # ----------------------------------------

    if isinstance(
        erro,
        AlertaConfiguracaoInvalidaError
    ):

        logger.error(
            "Configuração inválida no Dashboard: %s",
            erro
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Não foi possível gerar o Dashboard "
                "devido a uma configuração interna."
            )
        ) from erro

    # ----------------------------------------
    # OUTRAS EXCEÇÕES
    # ----------------------------------------

    raise erro


# ============================================
# READ - GERAR DASHBOARD DE UMA ESCOLA
# ============================================

def gerar_dashboard_escola_controller(
    escola_id: int,
    db: Session,
    usuario: Usuario,
    data_inicio: date | None = None,
    data_fim: date | None = None
) -> DashboardEscolaResponse:
    """
    Coordena a geração do Dashboard.

    A lógica de consulta e agregação
    permanece no Dashboard Service.
    """

    try:

        dashboard = gerar_dashboard_escola(
            db=db,
            escola_id=escola_id,
            usuario=usuario,
            data_inicio=data_inicio,
            data_fim=data_fim
        )

        return DashboardEscolaResponse.model_validate(
            dashboard
        )

    except (
        IndicadorNaoEncontradoError,
        IndicadorPermissaoError,
        IndicadorPeriodoInvalidoError,
        AlertaConfiguracaoInvalidaError
    ) as erro:

        tratar_erro_dashboard(erro)
