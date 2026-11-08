
from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator
)


# ============================================
# CAMPOS COMUNS DO ALUNO
# ============================================

class AlunoBase(BaseModel):

    codigo_aluno: str = Field(
        min_length=1,
        max_length=20
    )

    nome: str = Field(
        min_length=3,
        max_length=150
    )

    @field_validator(
        "codigo_aluno",
        "nome",
        mode="before"
    )
    @classmethod
    def limpar_texto(cls, valor):

        if isinstance(valor, str):
            return valor.strip()

        return valor


# ============================================
# CREATE - CADASTRAR ALUNO
# ============================================

class AlunoCreate(AlunoBase):

    turma_id: int = Field(
        gt=0
    )


# ============================================
# UPDATE - ATUALIZAR ALUNO
# ============================================

class AlunoUpdate(AlunoBase):

    turma_id: int = Field(
        gt=0
    )


# ============================================
# RESPONSE - RETORNO DA API
# ============================================

class AlunoResponse(AlunoBase):

    id: int

    turma_id: int

    ativo: bool

    criado_em: datetime

    model_config = ConfigDict(
        from_attributes=True
    )
