
from getpass import getpass

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.database.connection import SessionLocal

# Importamos todos os Models relacionados
from app.models.escola_model import Escola
from app.models.turma_model import Turma
from app.models.aluno_model import Aluno
from app.models.frequencia_model import Frequencia
from app.models.intervencao_model import Intervencao
from app.models.usuario_model import Usuario

from app.config.security import gerar_hash_senha


def cadastrar_admin_teste():

    db = SessionLocal()

    try:
        # Procura a escola fictícia já cadastrada
        escola = db.execute(
            select(Escola).where(
                Escola.nome == "Escola Municipal Exemplo",
                Escola.ativo.is_(True)
            )
        ).scalars().first()

        if escola is None:
            print("Escola Municipal Exemplo não encontrada.")
            print("Verifique os registros do MySQL.")
            return

        # Verifica se o administrador já existe
        admin_existente = db.execute(
            select(Usuario).where(
                Usuario.matricula == "admin.demo"
            )
        ).scalar_one_or_none()

        if admin_existente is not None:
            print("O administrador de teste já existe.")
            print("Nenhuma alteração foi realizada.")
            return

        # Solicita a senha sem exibi-la
        senha = getpass(
            "Digite a senha do administrador: "
        )

        confirmar_senha = getpass(
            "Confirme a senha: "
        )

        # Valida as duas entradas
        if senha != confirmar_senha:
            print("As senhas não coincidem.")
            return

        if len(senha) < 12:
            print("A senha precisa ter 12 caracteres ou mais.")
            return

        # Gera o hash protegido
        senha_hash = gerar_hash_senha(senha)

        # Cria o administrador fictício
        administrador = Usuario(
            nome="Administrador de Testes",
            matricula="admin.demo",
            email="admin.demo@example.com",
            senha_hash=senha_hash,
            perfil="ADMINISTRADOR",
            ativo=True,
            escola_id=escola.id
        )

        # Salva no MySQL
        db.add(administrador)
        db.commit()

        print("Administrador cadastrado com sucesso!")
        print("Matrícula: admin.demo")
        print("Perfil: ADMINISTRADOR")
        print("Ambiente: desenvolvimento")

    except SQLAlchemyError as erro:
        db.rollback()

        print("Erro ao cadastrar administrador.")
        print(f"Tipo: {type(erro).__name__}")

    finally:
        db.close()


if __name__ == "__main__":
    cadastrar_admin_teste()
