
from datetime import date, datetime
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator
)


# ============================================
# CAMPOS COMUNS DA FREQUÊNCIA
# ============================================

class FrequenciaBase(BaseModel):

    data: date

    situacao: Literal[
        "PRESENTE",
        "AUSENTE",
        "JUSTIFICADA"
    ]

    observacao: str | None = Field(
        default=None,
        max_length=255
    )

    # Normaliza a situação antes da validação
    @field_validator(
        "situacao",
        mode="before"
    )
    @classmethod
    def normalizar_situacao(cls, valor):

        if isinstance(valor, str):
            return valor.strip().upper()

        return valor

    # Remove espaços da observação
    @field_validator(
        "observacao",
        mode="before"
    )
    @classmethod
    def limpar_observacao(cls, valor):

        if isinstance(valor, str):
            valor = valor.strip()

            if not valor:
                return None

        return valor


# ============================================
# CREATE - REGISTRAR FREQUÊNCIA
# ============================================

class FrequenciaCreate(FrequenciaBase):

    aluno_id: int = Field(
        gt=0
    )


# ============================================
# UPDATE - ATUALIZAR FREQUÊNCIA
# ============================================

class FrequenciaUpdate(FrequenciaBase):

    aluno_id: int = Field(
        gt=0
    )


# ============================================
# RESPONSE - RETORNO DA API
# ============================================

class FrequenciaResponse(FrequenciaBase):

    id: int

    aluno_id: int

    registrado_em: datetime

    model_config = ConfigDict(
        from_attributes=True
    )
