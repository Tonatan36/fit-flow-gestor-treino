const FitFlow = {
    // Banco de dados local de exercícios
    bancoExercicios: [
        { id: 1, nome: "Supino Reto", grupo: "Peito" },
        { id: 2, nome: "Agachamento", grupo: "Pernas" },
        { id: 3, nome: "Puxada Pulley", grupo: "Costas" },
        { id: 4, nome: "Rosca Direta", grupo: "Braços" },
        { id: 5, nome: "Leg Press", grupo: "Pernas" },
        { id: 6, nome: "Desenvolvimento", grupo: "Ombros" },
        { id: 7, nome: "Prancha Abdominal", grupo: "Core" }
    ],

    treinos: JSON.parse(localStorage.getItem('fitflow_treinos')) || [],
    treinoSendoEditado: null,

    init() {
        this.setupEventListeners();
        this.render();
    },

    setupEventListeners() {
        // Abrir diálogo para novo treino
        document.getElementById('btn-novo-treino').addEventListener('click', () => {
            const nome = prompt("Dê um nome ao treino (ex: Treino A):");
            if (nome && nome.trim() !== "") this.criarTreino(nome.trim());
        });

        // Fechar Modal no X
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.fecharModal();
        });

        // Fechar modal ao clicar fora
        window.onclick = (event) => {
            const modal = document.getElementById('modal-exercicios');
            if (event.target == modal) this.fecharModal();
        };
    },

    criarTreino(nome) {
        const novoTreino = {
            id: Date.now(),
            nome: nome,
            exercicios: []
        };
        this.treinos.push(novoTreino);
        this.atualizar();
    },

    abrirModalExercicios(idTreino) {
        this.treinoSendoEditado = idTreino;
        const modal = document.getElementById('modal-exercicios');
        const listaOpcoes = document.getElementById('lista-opcoes-exercicios');
        
        modal.style.display = 'block';
        
        listaOpcoes.innerHTML = this.bancoExercicios.map(ex => `
            <div class="item-exercicio" onclick="FitFlow.adicionarExercicio(${ex.id})">
                <p>${ex.nome}</p>
                <span>${ex.grupo}</span>
            </div>
        `).join('');
    },

    fecharModal() {
        document.getElementById('modal-exercicios').style.display = 'none';
        this.treinoSendoEditado = null;
    },

    adicionarExercicio(idExercicio) {
        const treino = this.treinos.find(t => t.id === this.treinoSendoEditado);
        const exEncontrado = this.bancoExercicios.find(e => e.id === idExercicio);
        
        if (treino && exEncontrado) {
            treino.exercicios.push(exEncontrado.nome);
            this.atualizar();
            this.fecharModal();
        }
    },

    deletarTreino(id) {
        if (confirm("Deseja realmente excluir este treino?")) {
            this.treinos = this.treinos.filter(t => t.id !== id);
            this.atualizar();
        }
    },

    atualizar() {
        localStorage.setItem('fitflow_treinos', JSON.stringify(this.treinos));
        this.render();
    },

    render() {
        const lista = document.getElementById('lista-treinos');
        if (!lista) return;

        if (this.treinos.length === 0) {
            lista.innerHTML = `
                <div class="card-vazio">
                    <p>Nenhum treino criado. Comece clicando em "+ Novo Treino" 💪</p>
                </div>`;
            return;
        }

        lista.innerHTML = this.treinos.map(treino => `
            <div class="card-treino">
                <h3>${treino.nome}</h3>
                <ul class="lista-exercicios-card">
                    ${treino.exercicios.length > 0 
                        ? treino.exercicios.map(ex => `<li>✅ ${ex}</li>`).join('') 
                        : '<li><i>Nenhum exercício adicionado</i></li>'}
                </ul>
                <div class="card-actions">
                    <button class="btn-add-ex" onclick="FitFlow.abrirModalExercicios(${treino.id})">+ Add Exercício</button>
                    <button class="btn-delete" onclick="FitFlow.deletarTreino(${treino.id})">🗑️</button>
                </div>
            </div>
        `).join('');
    }
};

// Iniciar Aplicação
FitFlow.init();
