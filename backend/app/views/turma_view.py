
from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator
)

from typing import Literal


# Campos comuns da Turma
class TurmaBase(BaseModel):

    nome: str = Field(
        min_length=2,
        max_length=20
    )

    serie: str = Field(
        min_length=2,
        max_length=20
    )

    turno: Literal[
        "Manhã",
        "Tarde",
        "Noite",
        "Integral"
    ]

    ano_letivo: int = Field(
        ge=2000,
        le=2100
    )

    @field_validator("nome", "serie", mode="before")
    @classmethod
    def limpar_texto(cls, valor):
        if isinstance(valor, str):
            return valor.strip()

        return valor


# Schema para cadastrar uma turma
class TurmaCreate(TurmaBase):

    escola_id: int = Field(
        gt=0
    )


# Schema para atualizar uma turma
class TurmaUpdate(TurmaBase):

    escola_id: int = Field(
        gt=0
    )


# Schema para respostas da API
class TurmaResponse(TurmaBase):

    id: int

    escola_id: int

    ativo: bool

    model_config = ConfigDict(
        from_attributes=True
    )
