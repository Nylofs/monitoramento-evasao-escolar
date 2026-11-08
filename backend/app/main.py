
from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware


# ============================================
# IMPORTAÇÃO DOS ROTEADORES
# ============================================

from app.routes.sistema_routes import (
    router as sistema_router
)

from app.routes.auth_routes import (
    router as auth_router
)

from app.routes.escola_routes import (
    router as escola_router
)

from app.routes.turma_routes import (
    router as turma_router
)

from app.routes.aluno_routes import (
    router as aluno_router
)

from app.routes.frequencia_routes import (
    router as frequencia_router
)

from app.routes.intervencao_routes import (
    router as intervencao_router
)

from app.routes.indicador_routes import (
    router as indicador_router
)

from app.routes.alerta_routes import (
    router as alerta_router
)

from app.routes.dashboard_routes import (
    router as dashboard_router
)


# ============================================
# CONFIGURAÇÃO DA API
# ============================================

app = FastAPI(
    title="API - Prevenção de Evasão Escolar",
    description=(
        "API do Sistema de Monitoramento e "
        "Prevenção de Evasão Escolar."
    ),
    version="1.0.0"
)


# ============================================
# CONFIGURAÇÃO DO CORS
# ============================================

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ============================================
# ROTA INICIAL
# ============================================

@app.get("/", tags=["Sistema"])
def inicio():

    return {
        "mensagem": (
            "Bem-vindo à API do Sistema de "
            "Prevenção de Evasão Escolar"
        ),
        "versao": "1.0.0",
        "status": "online"
    }


# ============================================
# REGISTRO DOS ROTEADORES
# ============================================

app.include_router(sistema_router)

app.include_router(auth_router)

app.include_router(escola_router)

app.include_router(turma_router)

app.include_router(aluno_router)

app.include_router(frequencia_router)

app.include_router(intervencao_router)

app.include_router(indicador_router)

app.include_router(alerta_router)

app.include_router(dashboard_router)
