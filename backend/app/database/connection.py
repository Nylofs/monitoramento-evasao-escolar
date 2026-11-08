
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import declarative_base, sessionmaker

# Localiza a pasta backend
BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)

# Carrega as variáveis do arquivo .env
load_dotenv(
    os.path.join(BASE_DIR, ".env")
)

# Recupera as configurações do banco
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

# Verifica as configurações obrigatórias
if not all([DB_USER, DB_PASSWORD, DB_NAME]):
    raise ValueError(
        "Configurações do banco incompletas no .env"
    )

# Monta o endereço de conexão
DATABASE_URL = URL.create(
    drivername="mysql+pymysql",
    username=DB_USER,
    password=DB_PASSWORD,
    host=DB_HOST,
    port=DB_PORT,
    database=DB_NAME,
    query={"charset": "utf8mb4"}
)

# Configura o mecanismo de conexão
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600
)

# Cria a fábrica de sessões
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base utilizada pelos Models
Base = declarative_base()

# Fornece uma sessão para as operações
def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
