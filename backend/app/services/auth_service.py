
from sqlalchemy import select
from sqlalchemy.orm import Session

# Importando todos os Models relacionados
from app.models.escola_model import Escola
from app.models.turma_model import Turma
from app.models.aluno_model import Aluno
from app.models.frequencia_model import Frequencia
from app.models.intervencao_model import Intervencao
from app.models.usuario_model import Usuario

from app.config.security import verificar_senha
from app.config.token import criar_token_acesso


def autenticar_usuario(
    db: Session,
    matricula: str,
    senha: str
) -> str | None:

    # Consulta o usuario pela matricula
    usuario = db.execute(
        select(Usuario).where(
            Usuario.matricula == matricula
        )
    ).scalar_one_or_none()

    # Verifica se o usuario existe
    if usuario is None:
        return None

    # Verifica se o usuario esta ativo
    if not usuario.ativo:
        return None

    # Compara a senha com o hash armazenado
    if not verificar_senha(
        senha,
        usuario.senha_hash
    ):
        return None

    # Gera o token JWT
    token = criar_token_acesso(usuario.id)

    return token


def buscar_usuario_por_id(
    db: Session,
    usuario_id: int
) -> Usuario | None:

    # Busca o usuario pelo ID
    usuario = db.get(
        Usuario,
        usuario_id
    )

    if usuario is None:
        return None

    if not usuario.ativo:
        return None

    return usuario
