
from datetime import date, datetime
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator
)


# ============================================
# CAMPOS COMUNS DA INTERVENÇÃO
# ============================================

class IntervencaoBase(BaseModel):

    etapa: Literal[
        "CONVERSA_ALUNO",
        "CONTATO_FAMILIA",
        "ENCAMINHAMENTO_INSTITUCIONAL"
    ]

    status: Literal[
        "ABERTO",
        "EM_ANDAMENTO",
        "CONCLUIDO"
    ] = "ABERTO"

    data_intervencao: date

    descricao: str = Field(
        min_length=5
    )

    resultado: str | None = Field(
        default=None
    )

    responsavel: str = Field(
        min_length=3,
        max_length=150
    )

    proximo_contato: date | None = Field(
        default=None
    )

    # ========================================
    # NORMALIZAÇÃO DE ETAPA E STATUS
    # ========================================

    @field_validator(
        "etapa",
        "status",
        mode="before"
    )
    @classmethod
    def normalizar_opcoes(cls, valor):

        if isinstance(valor, str):
            return valor.strip().upper()

        return valor

    # ========================================
    # LIMPEZA DOS TEXTOS OBRIGATÓRIOS
    # ========================================

    @field_validator(
        "descricao",
        "responsavel",
        mode="before"
    )
    @classmethod
    def limpar_textos_obrigatorios(cls, valor):

        if isinstance(valor, str):
            return valor.strip()

        return valor

    # ========================================
    # LIMPEZA DO RESULTADO OPCIONAL
    # ========================================

    @field_validator(
        "resultado",
        mode="before"
    )
    @classmethod
    def limpar_resultado(cls, valor):

        if isinstance(valor, str):

            valor = valor.strip()

            if not valor:
                return None

        return valor


# ============================================
# CREATE - CADASTRAR INTERVENÇÃO
# ============================================

class IntervencaoCreate(IntervencaoBase):

    aluno_id: int = Field(
        gt=0
    )


# ============================================
# UPDATE - ATUALIZAR INTERVENÇÃO
# ============================================

class IntervencaoUpdate(IntervencaoBase):

    aluno_id: int = Field(
        gt=0
    )


# ============================================
# RESPONSE - RETORNO DA API
# ============================================

class IntervencaoResponse(IntervencaoBase):

    id: int

    aluno_id: int

    criado_em: datetime

    model_config = ConfigDict(
        from_attributes=True
    )
