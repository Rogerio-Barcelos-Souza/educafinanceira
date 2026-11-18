const formulario = document.getElementById("formFinanceiro");
const mensagem = document.getElementById("mensagemResultado");
const resumo = document.getElementById("resumo");

let graficoGastos = null;
let graficoRenda = null;

const categorias = [
    { id: "moradia", nome: "Moradia" },
    { id: "alimentacao", nome: "Alimentação" },
    { id: "transporte", nome: "Transporte" },
    { id: "saude", nome: "Saúde e educação" },
    { id: "lazer", nome: "Lazer" },
    { id: "outros", nome: "Outros gastos" }
];

const formatoMoeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

// LER DADOS DO FORMULÁRIO

function obterDados() {

    const dados = {
        renda: Number(document.getElementById("renda").value),
        despesas: {}
    };

    categorias.forEach(categoria => {
        dados.despesas[categoria.id] =
            Number(document.getElementById(categoria.id).value);
    });

    return dados;
}

// CALCULAR DESPESAS

function calcularTotal(despesas) {

    return Object.values(despesas).reduce(
        (total, valor) => total + valor, 0
    );
}

// MOSTRAR RESULTADO

function mostrarResultado(dados) {

    const totalGastos = calcularTotal(dados.despesas);

    const saldo = dados.renda - totalGastos;

    const percentual = dados.renda > 0
        ? (totalGastos / dados.renda) * 100
        : null;

    let situacao = "";

    if (dados.renda === 0) {
        situacao = "Sem renda declarada. Não é possível calcular o percentual.";
    } else if (saldo < 0) {
        situacao = "Atenção: suas despesas ultrapassam sua renda.";
    } else if (saldo === 0) {
        situacao = "Sua renda está totalmente comprometida.";
    } else {
        situacao = "Suas despesas estão abaixo da sua renda.";
    }

    mensagem.textContent =
        "Análise concluída! " + situacao;

    resumo.innerHTML = "";

    const indicadores = [
        {
            titulo: "Renda mensal",
            valor: formatoMoeda.format(dados.renda)
        },
        {
            titulo: "Total de despesas",
            valor: formatoMoeda.format(totalGastos)
        },
        {
            titulo: "Saldo mensal",
            valor: formatoMoeda.format(saldo)
        },
        {
            titulo: "Renda comprometida",
            valor: percentual === null
                ? "Não calculável"
                : percentual.toFixed(1) + "%"
        }
    ];

    indicadores.forEach(item => {

        const cartao = document.createElement("article");

        cartao.className = "card";

        const titulo = document.createElement("h3");
        titulo.textContent = item.titulo;

        const valor = document.createElement("p");
        valor.textContent = item.valor;

        cartao.appendChild(titulo);
        cartao.appendChild(valor);

        resumo.appendChild(cartao);
    });

    criarGraficos(dados);
}

// CRIAR GRÁFICOS

function criarGraficos(dados) {

    const nomes = categorias.map(c => c.nome);

    const valores = categorias.map(
        c => dados.despesas[c.id]
    );

    if (graficoGastos) {
        graficoGastos.destroy();
    }

    if (graficoRenda) {
        graficoRenda.destroy();
    }

    graficoGastos = new Chart(
        document.getElementById("graficoGastos"),
        {
            type: "doughnut",

            data: {
                labels: nomes,

                datasets: [{
                    label: "Despesas mensais",

                    data: valores,

                    backgroundColor: [
                        "#174C40",
                        "#26866A",
                        "#58A98A",
                        "#A5CBB4",
                        "#E4BC65",
                        "#8A9F94"
                    ],

                    borderWidth: 2,
                    borderColor: "#ffffff"
                }]
            },

            options: {
                responsive: true,

                plugins: {
                    legend: {
                        position: "bottom"
                    },

                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ": " +
                                    formatoMoeda.format(context.raw);
                            }
                        }
                    }
                }
            }
        }
    );

    const totalGastos = calcularTotal(dados.despesas);

    graficoRenda = new Chart(
        document.getElementById("graficoRenda"),
        {
            type: "bar",

            data: {
                labels: ["Renda", "Despesas", "Saldo"],

                datasets: [{
                    label: "Valores mensais",

                    data: [
                        dados.renda,
                        totalGastos,
                        dados.renda - totalGastos
                    ],

                    backgroundColor: [
                        "#174C40",
                        "#E4BC65",
                        "#26866A"
                    ],

                    borderRadius: 8
                }]
            },

            options: {
                responsive: true,

                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return formatoMoeda.format(value);
                            }
                        }
                    }
                },

                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        }
    );
}

// SALVAR RESPOSTAS

formulario.addEventListener("submit", function(event) {

    event.preventDefault();

    if (!formulario.reportValidity()) {
        return;
    }

    const dados = obterDados();

    const totalGastos = calcularTotal(dados.despesas);

    if (totalGastos > 1000000000 || dados.renda > 1000000000) {
        mensagem.textContent = "Confira os valores informados.";
        return;
    }

    try {
        localStorage.setItem(
            "dadosFinanceiros",
            JSON.stringify(dados)
        );
    } catch (erro) {
        mensagem.textContent =
            "Não foi possível salvar os dados neste navegador.";
        return;
    }

    mostrarResultado(dados);

    mensagem.textContent +=
        " Seus dados foram salvos neste navegador.";

    document.getElementById("resultados")
        .scrollIntoView({ behavior: "smooth" });
});

// RECUPERAR DADOS SALVOS

window.addEventListener("DOMContentLoaded", function() {

    try {

        const dadosSalvos = localStorage.getItem("dadosFinanceiros");

        if (!dadosSalvos) return;

        const dados = JSON.parse(dadosSalvos);

        if (
            !dados ||
            typeof dados.renda !== "number" ||
            !Number.isFinite(dados.renda) ||
            !dados.despesas ||
            typeof dados.despesas !== "object"
        ) {
            return;
        }

        const despesasValidas = {};

        for (const categoria of categorias) {
            const valor = dados.despesas[categoria.id];

            if (typeof valor !== "number" || !Number.isFinite(valor) || valor < 0) {
                return;
            }

            despesasValidas[categoria.id] = valor;
        }

        if (dados.renda < 0) return;

        const dadosAtualizados = {
            renda: dados.renda,
            despesas: despesasValidas
        };

        document.getElementById("renda").value = dadosAtualizados.renda;

        categorias.forEach(categoria => {
            document.getElementById(categoria.id).value =
                dadosAtualizados.despesas[categoria.id];
        });

        mostrarResultado(dadosAtualizados);

        mensagem.textContent =
            "Seus últimos dados foram recuperados.";

    } catch (erro) {
        mensagem.textContent =
            "Não foi possível recuperar os dados anteriores.";
    }
});

// APAGAR DADOS

document.getElementById("limparDados")
    .addEventListener("click", function() {

        localStorage.removeItem("dadosFinanceiros");

        formulario.reset();

        resumo.innerHTML = "";
        mensagem.textContent = "";

        if (graficoGastos) {
            graficoGastos.destroy();
            graficoGastos = null;
        }

        if (graficoRenda) {
            graficoRenda.destroy();
            graficoRenda = null;
        }

        alert("Dados apagados deste navegador!");
    });
