
from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator
)

# ============================================
# REUTILIZAÇÃO DOS SCHEMAS DE INDICADORES
# ============================================

from app.views.indicador_view import (
    PeriodoIndicador,
    ResumoFrequencia,
    PercentuaisFrequencia
)


# ============================================
# RESUMO DA ESTRUTURA ESCOLAR
# ============================================

class DashboardEscolaResumo(BaseModel):
    """
    Representa a identificação da escola
    e as quantidades de turmas e alunos ativos.
    """

    escola_id: int = Field(gt=0)

    nome_escola: str = Field(min_length=1)

    total_turmas_ativas: int = Field(ge=0)

    total_alunos_ativos: int = Field(ge=0)


# ============================================
# RESUMO GERAL DE FREQUÊNCIA
# ============================================

class DashboardFrequenciaResumo(BaseModel):
    """
    Representa os registros de frequência
    dos alunos considerados no dashboard.
    """

    alunos_com_registros: int = Field(ge=0)

    alunos_sem_registros: int = Field(ge=0)

    resumo: ResumoFrequencia

    percentuais: PercentuaisFrequencia

    @model_validator(mode="after")
    def validar_percentuais(self):
        """
        Sem registros, os percentuais
        devem ser indisponíveis (None).
        """

        if self.resumo.total_registros == 0:

            valores = (
                self.percentuais.percentual_presenca,
                self.percentuais.percentual_ausencia,
                self.percentuais.percentual_justificada,
                self.percentuais.percentual_ausencia_total
            )

            if any(
                valor is not None
                for valor in valores
            ):
                raise ValueError(
                    "Sem registros de frequência, "
                    "os percentuais devem ser nulos."
                )

        return self


# ============================================
# DISTRIBUIÇÃO DOS ALERTAS
# ============================================

class DashboardAlertasResumo(BaseModel):
    """
    Contabiliza os níveis dos alertas
    entre os alunos ativos da escola.
    """

    minimo_registros: int = Field(ge=1)

    total_sem_dados: int = Field(ge=0)

    total_dados_insuficientes: int = Field(ge=0)

    total_regular: int = Field(ge=0)

    total_atencao: int = Field(ge=0)

    total_prioritario: int = Field(ge=0)

    total_requer_acompanhamento: int = Field(
        ge=0
    )

    @model_validator(mode="after")
    def validar_acompanhamento(self):

        total_esperado = (
            self.total_atencao
            + self.total_prioritario
        )

        if (
            self.total_requer_acompanhamento
            != total_esperado
        ):
            raise ValueError(
                "O total de acompanhamento "
                "deve corresponder à soma "
                "dos níveis ATENCAO e PRIORITARIO."
            )

        return self

    def calcular_total_classificado(self) -> int:
        """
        Soma todas as classificações.
        Método auxiliar usado na validação
        do dashboard completo.
        """

        return (
            self.total_sem_dados
            + self.total_dados_insuficientes
            + self.total_regular
            + self.total_atencao
            + self.total_prioritario
        )


# ============================================
# RESUMO DAS INTERVENÇÕES
# ============================================

class DashboardIntervencoesResumo(BaseModel):
    """
    Representa as quantidades de intervenções
    por status no período selecionado.
    """

    total_intervencoes: int = Field(ge=0)

    total_abertas: int = Field(ge=0)

    total_em_andamento: int = Field(ge=0)

    total_concluidas: int = Field(ge=0)

    @model_validator(mode="after")
    def validar_total_intervencoes(self):

        soma = (
            self.total_abertas
            + self.total_em_andamento
            + self.total_concluidas
        )

        if soma != self.total_intervencoes:
            raise ValueError(
                "O total de intervenções deve "
                "corresponder à soma dos status."
            )

        return self


# ============================================
# RESPONSE - DASHBOARD DE UMA ESCOLA
# ============================================

class DashboardEscolaResponse(BaseModel):
    """
    Resposta consolidada do dashboard
    de monitoramento de uma escola.
    """

    escola: DashboardEscolaResumo

    periodo: PeriodoIndicador

    frequencia: DashboardFrequenciaResumo

    alertas: DashboardAlertasResumo

    intervencoes: DashboardIntervencoesResumo

    model_config = ConfigDict(
        from_attributes=True
    )

    # ========================================
    # VALIDAÇÃO GERAL DOS ALUNOS
    # ========================================

    @model_validator(mode="after")
    def validar_totais_dashboard(self):

        total_alunos = (
            self.escola.total_alunos_ativos
        )

        total_frequencia = (
            self.frequencia.alunos_com_registros
            + self.frequencia.alunos_sem_registros
        )

        if total_frequencia != total_alunos:
            raise ValueError(
                "O total de alunos da frequência "
                "deve corresponder ao total "
                "de alunos ativos da escola."
            )

        total_alertas = (
            self.alertas.calcular_total_classificado()
        )

        if total_alertas != total_alunos:
            raise ValueError(
                "A soma dos alertas deve "
                "corresponder ao total de "
                "alunos ativos da escola."
            )

        # ------------------------------------
        # CONSISTÊNCIA DOS ALUNOS SEM DADOS
        # ------------------------------------

        if (
            self.alertas.total_sem_dados
            != self.frequencia.alunos_sem_registros
        ):
            raise ValueError(
                "A quantidade de alunos SEM_DADOS "
                "deve corresponder aos alunos "
                "sem frequência registrada."
            )

        return self
