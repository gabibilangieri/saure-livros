document.addEventListener('DOMContentLoaded', async () => {
  // =========================================================
  // CONFIGURAÇÃO SIMPLES DA NUVEM (SUPABASE)
  // =========================================================
  const SUPABASE_URL = 'https://gxocqxjllvwsvzvekole.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_GvbaMG9S3IwZq_5nt9WEmA_gq1IuF8s';
  const REGISTRO_ID = 'principal';
  const CHAVE_BACKUP_LOCAL = 'sarue_livros_backup_v1';

  const nuvemConfigurada =
    SUPABASE_URL.startsWith('https://') &&
    !SUPABASE_URL.includes('COLE_AQUI') &&
    SUPABASE_ANON_KEY.length > 15 &&
    !SUPABASE_ANON_KEY.includes('COLE_AQUI');

  // Dados iniciais solicitados (todas as tarefas começam como "para-fazer")
  const estadoInicial = {
    slogan: 'Espaço reservado para o slogan da Saruê Livros...',
    colunas: [
      {
        id: 'bruna',
        nome: 'Bruna',
        tarefas: [
          { id: 't-1', texto: 'Alinhar com o Rafael questões do jurídico', status: 'para-fazer' },
          { id: 't-2', texto: 'Editar Segundo Sol', status: 'para-fazer' },
          { id: 't-3', texto: 'Editar Pupila', status: 'para-fazer' }
        ]
      },
      {
        id: 'gabi',
        nome: 'Gabi',
        tarefas: [
          { id: 't-4', texto: 'Editar Pupila', status: 'para-fazer' },
          { id: 't-5', texto: 'Estudar sobre marca e identidade visual (trazer opções)', status: 'para-fazer' }
        ]
      },
      {
        id: 'natalia',
        nome: 'Natália',
        tarefas: [
          { id: 't-6', texto: 'Escrever Exercícios de Silêncio', status: 'para-fazer' },
          { id: 't-7', texto: 'Editar Cartas pra Cecília', status: 'para-fazer' }
        ]
      },
      {
        id: 'rafael',
        nome: 'Rafael',
        tarefas: [
          { id: 't-8', texto: 'Cuidar das questões do jurídico e do estatuto da empresa', status: 'para-fazer' },
          { id: 't-9', texto: 'Selecionar algumas fanfics para estudarmos a qualidade', status: 'para-fazer' }
        ]
      }
    ],
    obras: [
      {
        id: 'obra-1',
        titulo: '',
        link: '',
        sinopse: '',
        curador: '',
        comentarios: ''
      }
    ]
  };

  let estado = clonar(estadoInicial);
  let filtroAtual = 'todas';
  let timerSalvar = null;

  // Referências do DOM
  const sloganEl = document.getElementById('slogan-editora');
  const gradeColunasEl = document.getElementById('grade-colunas');
  const gradeObrasEl = document.getElementById('grade-obras');
  const botoesAba = document.querySelectorAll('.navegacao__aba');
  const secoesAba = document.querySelectorAll('.secao-aba');
  const botoesFiltro = document.querySelectorAll('.filtro-btn');
  const btnAdicionarObra = document.getElementById('btn-adicionar-obra');
  const rodapeTextoEl = document.querySelector('.rodape p');

  function clonar(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function atualizarRodape(mensagem) {
    if (rodapeTextoEl) {
      rodapeTextoEl.textContent = mensagem;
    }
  }

  function salvarBackupLocal() {
    try {
      localStorage.setItem(CHAVE_BACKUP_LOCAL, JSON.stringify(estado));
    } catch (erro) {
      console.warn('Backup local indisponível:', erro);
    }
  }

  function carregarBackupLocal() {
    try {
      const salvo = localStorage.getItem(CHAVE_BACKUP_LOCAL);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (parsed && Array.isArray(parsed.colunas)) {
          return parsed;
        }
      }
    } catch (erro) {
      console.warn('Erro ao ler backup local:', erro);
    }
    return null;
  }

  function montarHeadersSupabase(incluirJson = false) {
    const headers = {
      apikey: SUPABASE_ANON_KEY
    };

    if (SUPABASE_ANON_KEY.startsWith('eyJ')) {
      headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
    }

    if (incluirJson) {
      headers['Content-Type'] = 'application/json';
      headers.Prefer = 'return=minimal';
    }

    return headers;
  }

  async function carregarEstadoDaNuvem() {
    if (!nuvemConfigurada) {
      const local = carregarBackupLocal();
      if (local) estado = local;
      atualizarRodape('Saruê Livros • Modo local (cole sua chave do Supabase no js/script.js para sincronizar a equipe)');
      return;
    }

    atualizarRodape('Saruê Livros • Sincronizando com a nuvem...');

    try {
      const endpoint = `${SUPABASE_URL}/rest/v1/sarue_workspace?id=eq.${encodeURIComponent(REGISTRO_ID)}&select=dados`;
      const resposta = await fetch(endpoint, {
        headers: montarHeadersSupabase(false)
      });

      if (!resposta.ok) {
        throw new Error(`HTTP ${resposta.status}`);
      }

      const linhas = await resposta.json();
      const dadosNuvem = linhas?.[0]?.dados;

      if (dadosNuvem && Array.isArray(dadosNuvem.colunas) && dadosNuvem.colunas.length > 0) {
        estado = dadosNuvem;
        salvarBackupLocal();
      } else {
        await enviarEstadoParaNuvem();
      }

      atualizarRodape('Saruê Livros • Conectado à nuvem (todos veem as alterações)');
    } catch (erro) {
      console.warn('Falha ao carregar da nuvem, usando backup local:', erro);
      const local = carregarBackupLocal();
      if (local) estado = local;
      atualizarRodape('Saruê Livros • Sem conexão com a nuvem no momento (exibindo cópia local)');
    }
  }

  async function enviarEstadoParaNuvem() {
    salvarBackupLocal();

    if (!nuvemConfigurada) return;

    try {
      const endpoint = `${SUPABASE_URL}/rest/v1/sarue_workspace?id=eq.${encodeURIComponent(REGISTRO_ID)}`;
      const resposta = await fetch(endpoint, {
        method: 'PATCH',
        headers: montarHeadersSupabase(true),
        body: JSON.stringify({
          dados: estado,
          atualizado_em: new Date().toISOString()
        })
      });

      if (!resposta.ok) {
        throw new Error(`HTTP ${resposta.status}`);
      }

      atualizarRodape('Saruê Livros • Alterações salvas na nuvem para toda a equipe');
    } catch (erro) {
      console.warn('Erro ao salvar na nuvem:', erro);
      atualizarRodape('Saruê Livros • Salvo localmente; falha ao enviar para a nuvem');
    }
  }

  function agendarSalvamento() {
    salvarBackupLocal();
    if (!nuvemConfigurada) return;

    atualizarRodape('Saruê Livros • Salvando alterações...');
    clearTimeout(timerSalvar);
    timerSalvar = setTimeout(() => {
      enviarEstadoParaNuvem();
    }, 450);
  }

  // Slogan editável no cabeçalho
  sloganEl.addEventListener('input', () => {
    estado.slogan = sloganEl.textContent.trim() || 'Espaço reservado para o slogan da Saruê Livros...';
    agendarSalvamento();
  });

  // Navegação entre abas ("Tarefas da Equipe" e "Obras a serem avaliadas")
  botoesAba.forEach((botao) => {
    botao.addEventListener('click', () => {
      const alvo = botao.dataset.aba;

      botoesAba.forEach((b) => b.classList.remove('navegacao__aba--ativa'));
      botao.classList.add('navegacao__aba--ativa');

      secoesAba.forEach((secao) => {
        secao.classList.toggle('secao-aba--ativa', secao.id === `aba-${alvo}`);
      });
    });
  });

  // Filtros de status
  botoesFiltro.forEach((botao) => {
    botao.addEventListener('click', () => {
      filtroAtual = botao.dataset.filtro;
      botoesFiltro.forEach((b) => b.classList.remove('filtro-btn--ativo'));
      botao.classList.add('filtro-btn--ativo');
      renderizarColunas();
    });
  });

  // Renderização das 4 colunas estilo bloquinho de notas
  function renderizarColunas() {
    gradeColunasEl.innerHTML = '';

    estado.colunas.forEach((coluna) => {
      const article = document.createElement('article');
      article.className = 'bloquinho';

      const tarefasFiltradas = coluna.tarefas.filter((t) => {
        if (filtroAtual === 'todas') return true;
        return t.status === filtroAtual;
      });

      const concluidas = coluna.tarefas.filter((t) => t.status === 'concluida').length;

      const cabecalho = document.createElement('div');
      cabecalho.className = 'bloquinho__cabecalho';
      cabecalho.innerHTML = `
        <h2 class="bloquinho__titulo">${escaparHTML(coluna.nome)}</h2>
        <span class="bloquinho__contador" title="Concluídas / Total">
          ${concluidas}/${coluna.tarefas.length}
        </span>
      `;
      article.appendChild(cabecalho);

      const ul = document.createElement('ul');
      ul.className = 'lista-tarefas';

      if (tarefasFiltradas.length === 0) {
        const liVazio = document.createElement('li');
        liVazio.className = 'lista-vazia';
        liVazio.textContent = 'Nenhuma tarefa neste filtro.';
        ul.appendChild(liVazio);
      } else {
        tarefasFiltradas.forEach((tarefa) => {
          const li = document.createElement('li');
          li.className = `tarefa-item ${tarefa.status === 'concluida' ? 'tarefa-item--concluida' : ''}`;

          li.innerHTML = `
            <div class="tarefa-item__topo">
              <span class="tarefa-item__texto">${escaparHTML(tarefa.texto)}</span>
              <button type="button" class="tarefa-item__remover" title="Excluir tarefa" aria-label="Excluir tarefa">&times;</button>
            </div>
            <div class="status-opcoes" role="group" aria-label="Status da tarefa">
              <button type="button" class="status-btn ${tarefa.status === 'para-fazer' ? 'status-btn--ativo' : ''}" data-status="para-fazer">
                <span class="status-btn__caixa"></span> Para fazer
              </button>
              <button type="button" class="status-btn ${tarefa.status === 'em-andamento' ? 'status-btn--ativo' : ''}" data-status="em-andamento">
                <span class="status-btn__caixa"></span> Em andamento
              </button>
              <button type="button" class="status-btn ${tarefa.status === 'concluida' ? 'status-btn--ativo' : ''}" data-status="concluida">
                <span class="status-btn__caixa"></span> Concluída
              </button>
            </div>
          `;

          li.querySelectorAll('.status-btn').forEach((btnStatus) => {
            btnStatus.addEventListener('click', () => {
              tarefa.status = btnStatus.dataset.status;
              renderizarColunas();
              agendarSalvamento();
            });
          });

          li.querySelector('.tarefa-item__remover').addEventListener('click', () => {
            coluna.tarefas = coluna.tarefas.filter((t) => t.id !== tarefa.id);
            renderizarColunas();
            agendarSalvamento();
          });

          ul.appendChild(li);
        });
      }

      article.appendChild(ul);

      const form = document.createElement('form');
      form.className = 'form-nova-tarefa';
      form.innerHTML = `
        <input
          type="text"
          class="form-nova-tarefa__input"
          placeholder="Nova tarefa para ${escaparHTML(coluna.nome)}..."
          aria-label="Nova tarefa para ${escaparHTML(coluna.nome)}"
          required
        >
        <button type="submit" class="form-nova-tarefa__btn" title="Adicionar tarefa">+</button>
      `;

      form.addEventListener('submit', (evento) => {
        evento.preventDefault();
        const input = form.querySelector('.form-nova-tarefa__input');
        const texto = input.value.trim();
        if (!texto) return;

        coluna.tarefas.push({
          id: `t-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
          texto,
          status: 'para-fazer'
        });

        renderizarColunas();
        agendarSalvamento();
      });

      article.appendChild(form);
      gradeColunasEl.appendChild(article);
    });
  }

  // Renderização dos cards multiplicáveis de "Obras a serem avaliadas"
  function renderizarObras() {
    gradeObrasEl.innerHTML = '';

    estado.obras.forEach((obra, indice) => {
      const card = document.createElement('article');
      card.className = 'card-obra';

      const urlValida = normalizarUrl(obra.link);

      card.innerHTML = `
        <div class="card-obra__topo">
          <span class="card-obra__numero">Obra #${indice + 1}</span>
          ${estado.obras.length > 1
            ? '<button type="button" class="card-obra__excluir">Remover</button>'
            : ''}
        </div>

        <div class="campo-grupo">
          <label for="titulo-${obra.id}">Título da obra</label>
          <input id="titulo-${obra.id}" type="text" placeholder="Ex.: Segundo Sol" value="${escaparAtributo(obra.titulo)}">
        </div>

        <div class="campo-grupo">
          <label for="curador-${obra.id}">Curador (quem adicionou)</label>
          <input id="curador-${obra.id}" type="text" placeholder="Ex.: Bruna, Gabi, Natália ou Rafael" value="${escaparAtributo(obra.curador)}">
        </div>

        <div class="campo-grupo">
          <label for="link-${obra.id}">Link da obra</label>
          <div class="linha-link">
            <input id="link-${obra.id}" type="url" placeholder="https://..." value="${escaparAtributo(obra.link)}">
            <a
              href="${urlValida || '#'}"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-abrir-obra ${urlValida ? '' : 'btn-abrir-obra--desabilitado'}"
            >
              Abrir obra
            </a>
          </div>
        </div>

        <div class="campo-grupo">
          <label for="sinopse-${obra.id}">Sinopse</label>
          <textarea id="sinopse-${obra.id}" placeholder="Resumo da história, premissa, gênero...">${escaparHTML(obra.sinopse)}</textarea>
        </div>

        <div class="campo-grupo">
          <label for="comentarios-${obra.id}">Comentários e opinião da equipe</label>
          <textarea id="comentarios-${obra.id}" placeholder="O que achamos da escrita, ritmo, potencial editorial...">${escaparHTML(obra.comentarios)}</textarea>
        </div>
      `;

      const inputTitulo = card.querySelector(`#titulo-${obra.id}`);
      const inputCurador = card.querySelector(`#curador-${obra.id}`);
      const inputLink = card.querySelector(`#link-${obra.id}`);
      const linkAbrir = card.querySelector('.btn-abrir-obra');
      const txtSinopse = card.querySelector(`#sinopse-${obra.id}`);
      const txtComentarios = card.querySelector(`#comentarios-${obra.id}`);
      const btnExcluir = card.querySelector('.card-obra__excluir');

      inputTitulo.addEventListener('input', () => {
        obra.titulo = inputTitulo.value;
        agendarSalvamento();
      });

      inputCurador.addEventListener('input', () => {
        obra.curador = inputCurador.value;
        agendarSalvamento();
      });

      inputLink.addEventListener('input', () => {
        obra.link = inputLink.value;
        const novaUrl = normalizarUrl(obra.link);
        if (novaUrl) {
          linkAbrir.href = novaUrl;
          linkAbrir.classList.remove('btn-abrir-obra--desabilitado');
        } else {
          linkAbrir.href = '#';
          linkAbrir.classList.add('btn-abrir-obra--desabilitado');
        }
        agendarSalvamento();
      });

      txtSinopse.addEventListener('input', () => {
        obra.sinopse = txtSinopse.value;
        agendarSalvamento();
      });

      txtComentarios.addEventListener('input', () => {
        obra.comentarios = txtComentarios.value;
        agendarSalvamento();
      });

      if (btnExcluir) {
        btnExcluir.addEventListener('click', () => {
          estado.obras = estado.obras.filter((item) => item.id !== obra.id);
          renderizarObras();
          agendarSalvamento();
        });
      }

      gradeObrasEl.appendChild(card);
    });
  }

  btnAdicionarObra.addEventListener('click', () => {
    estado.obras.push({
      id: `obra-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      titulo: '',
      link: '',
      sinopse: '',
      curador: '',
      comentarios: ''
    });
    renderizarObras();
    agendarSalvamento();
  });

  function normalizarUrl(valor) {
    const limpo = (valor || '').trim();
    if (!limpo) return '';
    if (/^https?:\/\//i.test(limpo)) return limpo;
    return `https://${limpo}`;
  }

  function escaparHTML(texto) {
    const div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
  }

  function escaparAtributo(texto) {
    return (texto || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Inicialização da página
  await carregarEstadoDaNuvem();
  sloganEl.textContent = estado.slogan;
  renderizarColunas();
  renderizarObras();
});
