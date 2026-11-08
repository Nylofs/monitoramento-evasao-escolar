
from getpass import getpass

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.database.connection import SessionLocal

# Importando todos os Models relacionados
from app.models.escola_model import Escola
from app.models.turma_model import Turma
from app.models.aluno_model import Aluno
from app.models.frequencia_model import Frequencia
from app.models.intervencao_model import Intervencao
from app.models.usuario_model import Usuario

from app.config.security import gerar_hash_senha


def redefinir_senha():

    db = SessionLocal()

    try:
        # Procura o usuario no banco
        usuario = db.execute(
            select(Usuario).where(
                Usuario.matricula == "coord.demo"
            )
        ).scalar_one_or_none()

        if usuario is None:
            print("Usuario coord.demo nao encontrado.")
            return

        print(f"Usuario encontrado: {usuario.matricula}")

        # Solicita a nova senha
        nova_senha = getpass(
            "Digite a nova senha: "
        )

        confirmar_senha = getpass(
            "Confirme a nova senha: "
        )

        # Verifica se as senhas coincidem
        if nova_senha != confirmar_senha:
            print("As senhas nao coincidem.")
            return

        # Verifica o tamanho da senha
        if len(nova_senha) < 12:
            print("A senha deve ter pelo menos 12 caracteres.")
            return

        # Gera o hash da nova senha
        novo_hash = gerar_hash_senha(nova_senha)

        # Atualiza o campo no banco
        usuario.senha_hash = novo_hash

        # Confirma a alteracao
        db.commit()

        print("Senha redefinida com sucesso!")
        print(f"Usuario: {usuario.matricula}")

    except SQLAlchemyError as erro:
        db.rollback()

        print("Erro de banco ou mapeamento SQLAlchemy.")
        print(f"Tipo: {type(erro).__name__}")
        print(f"Detalhes: {erro}")

    except Exception as erro:
        db.rollback()

        print("Erro inesperado.")
        print(f"Tipo: {type(erro).__name__}")

    finally:
        db.close()


if __name__ == "__main__":
    redefinir_senha()
