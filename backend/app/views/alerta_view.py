
from typing import Literal

from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
    model_validator
)

from app.views.indicador_view import (
    PeriodoIndicador,
    IndicadorAlunoResponse
)


# ============================================
# NÍVEIS POSSÍVEIS DOS ALERTAS
# ============================================

NivelAlerta = Literal[
    "SEM_DADOS",
    "DADOS_INSUFICIENTES",
    "REGULAR",
    "ATENCAO",
    "PRIORITARIO"
]


# ============================================
# RESPONSE - ALERTA DE UM ALUNO
# ============================================

class AlertaAlunoResponse(BaseModel):
    """
    Representa a análise operacional
    de frequência de um aluno.

    Não representa uma previsão estatística
    de abandono escolar.
    """

    indicador: IndicadorAlunoResponse

    nivel_alerta: NivelAlerta

    minimo_registros: int = Field(
        ge=1,
        description=(
            "Quantidade mínima de registros "
            "para aplicar os critérios de alerta."
        )
    )

    requer_acompanhamento: bool

    motivos: list[str] = Field(
        default_factory=list,
        description=(
            "Explicações objetivas que justificam "
            "a classificação apresentada."
        )
    )

    model_config = ConfigDict(
        from_attributes=True
    )

    # ========================================
    # CONSISTÊNCIA ENTRE DADOS E CLASSIFICAÇÃO
    # ========================================

    @model_validator(mode="after")
    def validar_classificacao(self):

        total = self.indicador.resumo.total_registros

        if total == 0:
            if self.nivel_alerta != "SEM_DADOS":
                raise ValueError(
                    "Aluno sem registros deve possuir "
                    "nível SEM_DADOS."
                )

        elif total < self.minimo_registros:
            if self.nivel_alerta != "DADOS_INSUFICIENTES":
                raise ValueError(
                    "Quantidade de registros insuficiente "
                    "para a classificação informada."
                )

        else:
            if self.nivel_alerta in (
                "SEM_DADOS",
                "DADOS_INSUFICIENTES"
            ):
                raise ValueError(
                    "A classificação não corresponde "
                    "à quantidade de registros."
                )

        niveis_acompanhamento = (
            "ATENCAO",
            "PRIORITARIO"
        )

        acompanhamento_esperado = (
            self.nivel_alerta in niveis_acompanhamento
        )

        if (
            self.requer_acompanhamento
            != acompanhamento_esperado
        ):
            raise ValueError(
                "O campo requer_acompanhamento "
                "não corresponde ao nível de alerta."
            )

        return self


# ============================================
# RESPONSE - RESUMO DOS ALERTAS POR TURMA
# ============================================

class AlertaTurmaResponse(BaseModel):
    """
    Resumo da distribuição de classificações
    dos alunos ativos de uma turma.
    """

    turma_id: int = Field(gt=0)

    nome_turma: str

    escola_id: int = Field(gt=0)

    periodo: PeriodoIndicador

    minimo_registros: int = Field(ge=1)

    total_alunos: int = Field(ge=0)

    total_sem_dados: int = Field(ge=0)

    total_dados_insuficientes: int = Field(ge=0)

    total_regular: int = Field(ge=0)

    total_atencao: int = Field(ge=0)

    total_prioritario: int = Field(ge=0)

    total_requer_acompanhamento: int = Field(
        ge=0
    )

    model_config = ConfigDict(
        from_attributes=True
    )

    # ========================================
    # CONSISTÊNCIA DAS QUANTIDADES
    # ========================================

    @model_validator(mode="after")
    def validar_totais(self):

        soma_classificacoes = (
            self.total_sem_dados
            + self.total_dados_insuficientes
            + self.total_regular
            + self.total_atencao
            + self.total_prioritario
        )

        if soma_classificacoes != self.total_alunos:
            raise ValueError(
                "A soma das classificações deve "
                "corresponder ao total de alunos."
            )

        total_acompanhamento = (
            self.total_atencao
            + self.total_prioritario
        )

        if (
            total_acompanhamento
            != self.total_requer_acompanhamento
        ):
            raise ValueError(
                "O total de acompanhamento deve "
                "corresponder à soma dos níveis "
                "ATENCAO e PRIORITARIO."
            )

        return self
