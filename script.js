const FitFlow = {
    bancoExercicios: [
        { id: 1, nome: "Supino Reto", grupo: "Peito" },
        { id: 2, nome: "Agachamento", grupo: "Pernas" },
        { id: 3, nome: "Puxada Pulley", grupo: "Costas" },
        { id: 4, nome: "Rosca Direta", grupo: "Braços" },
        { id: 5, nome: "Leg Press", grupo: "Pernas" },
        { id: 6, nome: "Desenvolvimento", grupo: "Ombros" },
        { id: 7, nome: "Prancha Abdominal", grupo: "Core" }
    ],

    treinos: [],
    treinoSendoEditado: null,
    treinoPendenteExclusao: null,
    treinoEmExecucao: null,
    exerciciosConcluidos: [],
    ultimoElementoAtivo: null,
    toastTimer: null,

    init() {
        this.carregarTreinos();
        this.setupEventListeners();
        this.render();
    },

    carregarTreinos() {
        try {
            const dados = JSON.parse(localStorage.getItem('fitflow_treinos') || '[]');
            this.treinos = Array.isArray(dados) ? dados.filter(treino =>
                treino && Number.isFinite(Number(treino.id)) &&
                typeof treino.nome === 'string' && Array.isArray(treino.exercicios)
            ).map(treino => ({
                id: Number(treino.id),
                nome: treino.nome,
                exercicios: treino.exercicios.filter(exercicio => typeof exercicio === 'string')
            })) : [];
        } catch (erro) {
            this.treinos = [];
            localStorage.removeItem('fitflow_treinos');
        }
    },

    setupEventListeners() {
        document.getElementById('btn-novo-treino').addEventListener('click', () => this.abrirNovoTreino());
        document.getElementById('form-novo-treino').addEventListener('submit', evento => this.submeterNovoTreino(evento));
        document.getElementById('nome-treino').addEventListener('input', evento => {
            evento.target.removeAttribute('aria-invalid');
            document.getElementById('erro-nome-treino').textContent = '';
        });

        document.getElementById('lista-treinos').addEventListener('click', evento => {
            const botao = evento.target.closest('button[data-action]');
            if (!botao) return;
            const id = Number(botao.dataset.id);
            if (botao.dataset.action === 'adicionar') this.abrirModalExercicios(id, botao);
            if (botao.dataset.action === 'executar') this.iniciarTreino(id, botao);
            if (botao.dataset.action === 'excluir') this.abrirConfirmacao(id, botao);
        });

        document.getElementById('lista-opcoes-exercicios').addEventListener('click', evento => {
            const botao = evento.target.closest('button[data-exercicio-id]');
            if (botao) this.adicionarExercicio(Number(botao.dataset.exercicioId));
        });

        document.querySelectorAll('.close-modal').forEach(botao => {
            botao.addEventListener('click', () => botao.closest('dialog').close());
        });
        document.querySelectorAll('[data-close-dialog]').forEach(botao => {
            botao.addEventListener('click', () => document.getElementById(botao.dataset.closeDialog).close());
        });

        document.querySelectorAll('dialog.modal').forEach(modal => {
            modal.addEventListener('click', evento => {
                if (evento.target === modal) modal.close();
            });
            modal.addEventListener('close', () => {
                if (modal.id === 'modal-exercicios') this.treinoSendoEditado = null;
                if (modal.id === 'modal-execucao') {
                    this.treinoEmExecucao = null;
                    this.exerciciosConcluidos = [];
                }
                if (this.ultimoElementoAtivo && document.contains(this.ultimoElementoAtivo)) {
                    this.ultimoElementoAtivo.focus();
                }
                this.ultimoElementoAtivo = null;
            });
        });

        document.getElementById('btn-cancelar-exclusao').addEventListener('click', () => document.getElementById('modal-confirmacao').close());
        document.getElementById('btn-confirmar-exclusao').addEventListener('click', () => this.confirmarExclusao());
        document.getElementById('lista-execucao').addEventListener('change', evento => {
            if (evento.target.matches('input[data-exercicio-index]')) this.alternarExercicioConcluido(Number(evento.target.dataset.exercicioIndex));
        });
        document.getElementById('btn-parar-treino').addEventListener('click', () => document.getElementById('modal-execucao').close());
        document.getElementById('btn-finalizar-treino').addEventListener('click', () => this.finalizarTreino());
    },

    abrirNovoTreino() {
        const modal = document.getElementById('modal-novo-treino');
        this.ultimoElementoAtivo = document.activeElement;
        document.getElementById('form-novo-treino').reset();
        document.getElementById('erro-nome-treino').textContent = '';
        modal.showModal();
        document.getElementById('nome-treino').focus();
    },

    submeterNovoTreino(evento) {
        evento.preventDefault();
        const campo = document.getElementById('nome-treino');
        const nome = campo.value.trim();
        if (!nome) {
            campo.setAttribute('aria-invalid', 'true');
            document.getElementById('erro-nome-treino').textContent = 'Informe um nome para o treino.';
            campo.focus();
            return;
        }
        const novoTreino = { id: Date.now(), nome, exercicios: [] };
        this.treinos.push(novoTreino);
        this.atualizar();
        document.getElementById('modal-novo-treino').close();
        this.mostrarToast(`Treino “${nome}” criado.`);
    },

    criarElemento(tag, className, texto) {
        const elemento = document.createElement(tag);
        if (className) elemento.className = className;
        if (texto !== undefined) elemento.textContent = texto;
        return elemento;
    },

    abrirModalExercicios(idTreino, origem) {
        this.treinoSendoEditado = idTreino;
        this.ultimoElementoAtivo = origem;
        const lista = document.getElementById('lista-opcoes-exercicios');
        lista.replaceChildren();

        this.bancoExercicios.forEach(exercicio => {
            const botao = this.criarElemento('button', 'item-exercicio');
            botao.type = 'button';
            botao.dataset.exercicioId = exercicio.id;
            const informacoes = this.criarElemento('span');
            informacoes.append(this.criarElemento('strong', '', exercicio.nome));
            const grupo = this.criarElemento('span', 'grupo-exercicio', exercicio.grupo);
            botao.append(informacoes, grupo);
            lista.append(botao);
        });

        document.getElementById('modal-exercicios').showModal();
    },

    fecharModal() {
        document.getElementById('modal-exercicios').close();
        this.treinoSendoEditado = null;
    },

    adicionarExercicio(idExercicio) {
        const treino = this.treinos.find(item => item.id === this.treinoSendoEditado);
        const exercicio = this.bancoExercicios.find(item => item.id === idExercicio);
        if (!treino || !exercicio) return;
        treino.exercicios.push(exercicio.nome);
        this.atualizar();
        this.fecharModal();
        this.mostrarToast(`${exercicio.nome} adicionado.`);
    },

    iniciarTreino(id, origem) {
        const treino = this.treinos.find(item => item.id === id);
        if (!treino) return;
        if (treino.exercicios.length === 0) {
            this.mostrarToast('Adicione pelo menos um exercício antes de executar.', true);
            return;
        }
        this.treinoEmExecucao = treino;
        this.exerciciosConcluidos = [];
        this.ultimoElementoAtivo = origem;
        document.getElementById('titulo-execucao').textContent = treino.nome;
        this.renderExecucao();
        document.getElementById('modal-execucao').showModal();
    },

    renderExecucao() {
        const treino = this.treinoEmExecucao;
        if (!treino) return;
        const lista = document.getElementById('lista-execucao');
        lista.replaceChildren();

        treino.exercicios.forEach((exercicio, indice) => {
            const concluido = this.exerciciosConcluidos.includes(indice);
            const item = this.criarElemento('label', `exercicio-execucao${concluido ? ' concluido' : ''}`);
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = concluido;
            checkbox.dataset.exercicioIndex = indice;
            const texto = this.criarElemento('span', '', exercicio);
            const status = this.criarElemento('span', 'status-exercicio', concluido ? 'Concluído' : 'Marcar');
            item.append(checkbox, texto, status);
            lista.append(item);
        });
        this.atualizarProgresso();
    },

    alternarExercicioConcluido(indice) {
        if (this.exerciciosConcluidos.includes(indice)) {
            this.exerciciosConcluidos = this.exerciciosConcluidos.filter(item => item !== indice);
        } else {
            this.exerciciosConcluidos.push(indice);
        }
        this.renderExecucao();
    },

    atualizarProgresso() {
        const treino = this.treinoEmExecucao;
        const total = treino ? treino.exercicios.length : 0;
        const concluidos = this.exerciciosConcluidos.length;
        const porcentagem = total === 0 ? 0 : Math.round((concluidos / total) * 100);
        document.getElementById('texto-progresso').textContent = `${concluidos} de ${total} exercícios concluídos`;
        document.getElementById('preenchimento-progresso').style.width = `${porcentagem}%`;
        const barra = document.querySelector('.barra-progresso');
        barra.setAttribute('aria-valuenow', porcentagem);
        document.getElementById('btn-finalizar-treino').disabled = concluidos !== total;
    },

    finalizarTreino() {
        const treino = this.treinoEmExecucao;
        if (!treino || this.exerciciosConcluidos.length !== treino.exercicios.length) {
            this.mostrarToast('Conclua todos os exercícios antes de finalizar.', true);
            return;
        }
        document.getElementById('modal-execucao').close();
        this.treinoEmExecucao = null;
        this.exerciciosConcluidos = [];
        this.mostrarToast(`Treino “${treino.nome}” finalizado!`);
    },

    abrirConfirmacao(id, origem) {
        const treino = this.treinos.find(item => item.id === id);
        if (!treino) return;
        this.treinoPendenteExclusao = id;
        this.ultimoElementoAtivo = origem;
        document.getElementById('texto-confirmacao').textContent = `O treino “${treino.nome}” será removido permanentemente.`;
        document.getElementById('modal-confirmacao').showModal();
        document.getElementById('btn-cancelar-exclusao').focus();
    },

    confirmarExclusao() {
        const treino = this.treinos.find(item => item.id === this.treinoPendenteExclusao);
        this.treinos = this.treinos.filter(item => item.id !== this.treinoPendenteExclusao);
        this.treinoPendenteExclusao = null;
        this.atualizar();
        document.getElementById('modal-confirmacao').close();
        if (treino) this.mostrarToast(`Treino “${treino.nome}” excluído.`);
    },

    atualizar() {
        try {
            localStorage.setItem('fitflow_treinos', JSON.stringify(this.treinos));
        } catch (erro) {
            this.mostrarToast('Não foi possível salvar os dados neste navegador.', true);
        }
        this.render();
    },

    mostrarToast(mensagem, erro = false) {
        const toast = document.getElementById('toast');
        toast.textContent = mensagem;
        toast.classList.toggle('erro', erro);
        toast.classList.add('visivel');
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => toast.classList.remove('visivel'), 3000);
    },

    render() {
        const lista = document.getElementById('lista-treinos');
        lista.replaceChildren();

        if (this.treinos.length === 0) {
            const vazio = this.criarElemento('div', 'card-vazio');
            vazio.append(this.criarElemento('p', '', 'Nenhum treino criado. Comece clicando em “+ Novo Treino” 💪'));
            lista.append(vazio);
            return;
        }

        this.treinos.forEach(treino => {
            const card = this.criarElemento('article', 'card-treino');
            card.append(this.criarElemento('h3', '', treino.nome));
            const listaExercicios = this.criarElemento('ul', 'lista-exercicios-card');
            if (treino.exercicios.length === 0) {
                listaExercicios.append(this.criarElemento('li', 'sem-exercicios', 'Nenhum exercício adicionado'));
            } else {
                treino.exercicios.forEach(exercicio => {
                    const item = this.criarElemento('li');
                    item.append(this.criarElemento('span', 'icone-check', '✓'));
                    item.append(document.createTextNode(exercicio));
                    listaExercicios.append(item);
                });
            }

            const acoes = this.criarElemento('div', 'card-actions');
            const adicionar = this.criarElemento('button', 'btn-add-ex', '+ Adicionar exercício');
            adicionar.type = 'button';
            adicionar.dataset.action = 'adicionar';
            adicionar.dataset.id = treino.id;
            const executar = this.criarElemento('button', 'btn-executar', '▶ Executar');
            executar.type = 'button';
            executar.dataset.action = 'executar';
            executar.dataset.id = treino.id;
            executar.disabled = treino.exercicios.length === 0;
            executar.setAttribute('aria-label', `Executar treino ${treino.nome}`);
            const excluir = this.criarElemento('button', 'btn-delete', 'Excluir');
            excluir.type = 'button';
            excluir.dataset.action = 'excluir';
            excluir.dataset.id = treino.id;
            excluir.setAttribute('aria-label', `Excluir treino ${treino.nome}`);
            acoes.append(adicionar, executar, excluir);
            card.append(listaExercicios, acoes);
            lista.append(card);
        });
    }
};

FitFlow.init();
