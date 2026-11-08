
from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator
)


class EscolaBase(BaseModel):

    nome: str = Field(
        min_length=3,
        max_length=150
    )

    codigo_inep: str | None = Field(
        default=None,
        pattern=r"^\d{8}$"
    )

    endereco: str | None = Field(
        default=None,
        max_length=255
    )

    bairro: str | None = Field(
        default=None,
        max_length=100
    )

    cidade: str = Field(
        default="Recife",
        min_length=2,
        max_length=100
    )

    uf: str = Field(
        default="PE",
        pattern=r"^[A-Z]{2}$"
    )

    @field_validator("nome", "cidade")
    @classmethod
    def validar_texto_obrigatorio(cls, valor: str):
        valor = valor.strip()

        if not valor:
            raise ValueError(
                "O campo não pode estar vazio."
            )

        return valor

    @field_validator("codigo_inep")
    @classmethod
    def normalizar_codigo_inep(
        cls,
        valor: str | None
    ):
        if valor is None:
            return None

        return valor.strip()

    @field_validator("uf")
    @classmethod
    def normalizar_uf(cls, valor: str):
        return valor.upper()


class EscolaCreate(EscolaBase):
    pass


class EscolaUpdate(EscolaBase):
    pass


class EscolaResponse(EscolaBase):

    id: int
    ativo: bool
    criado_em: datetime

    model_config = ConfigDict(
        from_attributes=True
    )
