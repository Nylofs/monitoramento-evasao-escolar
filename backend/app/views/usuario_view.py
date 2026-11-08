
from pydantic import BaseModel, Field, ConfigDict


class LoginRequest(BaseModel):

    matricula: str = Field(
        min_length=1,
        max_length=30
    )

    senha: str = Field(
        min_length=1
    )


class TokenResponse(BaseModel):

    access_token: str
    token_type: str = "bearer"


class UsuarioResponse(BaseModel):

    id: int
    nome: str
    matricula: str
    email: str
    perfil: str
    ativo: bool
    escola_id: int

    model_config = ConfigDict(
        from_attributes=True
    )
