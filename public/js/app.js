/* ============================================================
   HomeFlix - app.js
   ============================================================ */
(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);

  // -- refs: perfil --
  const telaPerfil = $('#telaPerfil');
  const appContainer = $('#appContainer');
  const listaPerfis = $('#listaPerfis');
  const btnAdicionarPerfil = $('#btnAdicionarPerfil');
  const modalCriarPerfil = $('#modalCriarPerfil');
  const fecharPerfil = $('#fecharPerfil');
  const btnFecharPerfil = $('#btnFecharPerfil');
  const inputNomePerfil = $('#inputNomePerfil');
  const perfilCores = $('#perfilCores');
  const btnCriarPerfil = $('#btnCriarPerfil');
  const avatarPerfil = $('#avatarPerfil');
  const nomePerfil = $('#nomePerfil');
  const btnTrocarPerfil = $('#btnTrocarPerfil');

  // -- refs: app --
  const carregando = $('#carregando');
  const vazio = $('#vazio');
  const telaPrincipal = $('#telaPrincipal');
  const telaSerie = $('#telaSerie');
  const playerTela = $('#playerTela');
  const gradeShows = $('#gradeShows');
  const listaTemporadas = $('#listaTemporadas');
  const campoBusca = $('#campoBusca');
  const btnHome = $('#btnHome');
  const btnAbrirConfig = $('#btnAbrirConfig');
  const btnFecharConfig = $('#btnFecharConfig');
  const fecharConfig = $('#fecharConfig');
  const modalConfig = $('#modalConfig');
  const btnSalvarPasta = $('#btnSalvarPasta');
  const inputPastaMedia = $('#inputPastaMedia');
  const btnVoltarLista = $('#btnVoltarLista');
  const btnVoltarPlayer = $('#btnVoltarPlayer');
  const videoPlayer = $('#videoPlayer');
  const playerShowNome = $('#playerShowNome');
  const playerEpInfo = $('#playerEpInfo');
  const playerEpTitulo = $('#playerEpTitulo');
  const playerEpMeta = $('#playerEpMeta');
  const playerEpLista = $('#playerEpLista');
  const proximoEpOverlay = $('#proximoEpOverlay');
  const proximoEpNome = $('#proximoEpNome');
  const btnProximoEpSim = $('#btnProximoEpSim');
  const btnProximoEpNao = $('#btnProximoEpNao');
  const barraFiltros = $('#barraFiltros');
  const listaFiltros = $('#listaFiltros');

  // -- refs: categorias --
  const btnGerenciarCats = $('#btnGerenciarCats');
  const modalCategorias = $('#modalCategorias');
  const fecharCats = $('#fecharCats');
  const btnFecharCats = $('#btnFecharCats');
  const catsShowNome = $('#catsShowNome');
  const inputNovaCat = $('#inputNovaCat');
  const btnAdicionarCat = $('#btnAdicionarCat');
  const listaCatsDisponiveis = $('#listaCatsDisponiveis');
  const listaCatsAtribuidas = $('#listaCatsAtribuidas');
  const serieCatsTags = $('#serieCatsTags');

  // -- cores dos perfis --
  const CORES_PERFIL = ['#e50914','#0071eb','#5b21b6','#059669','#d97706','#dc2626','#0891b2','#7c3aed','#0d9488','#c026d3'];

  // -- estado --
  let todosVideos = [];
  let usuarioAtual = null;
  let dadosWatch = {};
  let dadosCategorias = {};
  let todasCategorias = [];
  let filtroCategoriaAtiva = null;
  let serieSelecionada = null;
  let episodiosAtuais = [];
  let indiceEpAtual = -1;
  let temporadaAtual = 0;
  let proximoEpMostrado = false;
  let tempoCheckId = null;
  let corPerfilSelecionada = CORES_PERFIL[0];
  let catsEditandoShow = null;

  // ============================================================
  //  INICIALIZACAO
  // ============================================================
  function init() {
    // tenta restaurar sessao
    const userIdSalvo = localStorage.getItem('homeflix_userId');
    if (userIdSalvo) {
      carregarUsuarios().then(() => {
        const user = usuariosCache.find(u => u.id === userIdSalvo);
        if (user) { entrarPerfil(user); return; }
        mostrarTelaPerfil();
      });
    } else {
      mostrarTelaPerfil();
    }
    eventos();
  }

  let usuariosCache = [];

  function eventos() {
    btnAdicionarPerfil.addEventListener('click', () => modalCriarPerfil.style.display = 'flex');
    fecharPerfil.addEventListener('click', () => modalCriarPerfil.style.display = 'none');
    btnFecharPerfil.addEventListener('click', () => modalCriarPerfil.style.display = 'none');
    btnCriarPerfil.addEventListener('click', criarPerfil);
    btnTrocarPerfil.addEventListener('click', () => { sairPerfil(); });

    btnHome.addEventListener('click', irParaPrincipal);
    btnVoltarLista.addEventListener('click', irParaPrincipal);
    btnVoltarPlayer.addEventListener('click', fecharPlayer);
    btnAbrirConfig.addEventListener('click', () => modalConfig.style.display = 'flex');
    btnFecharConfig.addEventListener('click', () => modalConfig.style.display = 'none');
    fecharConfig.addEventListener('click', () => modalConfig.style.display = 'none');
    btnSalvarPasta.addEventListener('click', salvarPasta);
    campoBusca.addEventListener('input', onBusca);
    btnProximoEpSim.addEventListener('click', proximoEpSim);
    btnProximoEpNao.addEventListener('click', () => { proximoEpOverlay.style.display = 'none'; proximoEpMostrado = false; });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (modalCategorias.style.display !== 'none') { modalCategorias.style.display = 'none'; return; }
        if (modalCriarPerfil.style.display !== 'none') { modalCriarPerfil.style.display = 'none'; return; }
        if (proximoEpOverlay.style.display !== 'none') { proximoEpOverlay.style.display = 'none'; proximoEpMostrado = false; return; }
        if (playerTela.style.display !== 'none') { fecharPlayer(); return; }
      }
    });

    // categorias
    btnGerenciarCats.addEventListener('click', abrirModalCategorias);
    fecharCats.addEventListener('click', () => modalCategorias.style.display = 'none');
    btnFecharCats.addEventListener('click', () => modalCategorias.style.display = 'none');
    btnAdicionarCat.addEventListener('click', adicionarCategoriaGlobal);
    inputNovaCat.addEventListener('keydown', (e) => { if (e.key === 'Enter') adicionarCategoriaGlobal(); });

    // cores perfil
    CORES_PERFIL.forEach((cor, i) => {
      const div = document.createElement('div');
      div.className = 'perfil-cor-opcao' + (i === 0 ? ' perfil-cor-opcao--selecionada' : '');
      div.style.background = cor;
      div.addEventListener('click', () => {
        perfilCores.querySelectorAll('.perfil-cor-opcao').forEach(el => el.classList.remove('perfil-cor-opcao--selecionada'));
        div.classList.add('perfil-cor-opcao--selecionada');
        corPerfilSelecionada = cor;
      });
      perfilCores.appendChild(div);
    });
  }

  // ============================================================
  //  PERFIS
  // ============================================================
  async function carregarUsuarios() {
    try {
      const r = await fetch('/api/users');
      usuariosCache = await r.json();
    } catch { usuariosCache = []; }
  }

  function mostrarTelaPerfil() {
    telaPerfil.style.display = 'flex';
    appContainer.style.display = 'none';
    renderizarPerfis();
  }

  function renderizarPerfis() {
    listaPerfis.innerHTML = '';
    for (const u of usuariosCache) {
      const card = document.createElement('div');
      card.className = 'perfil-card';
      card.innerHTML = `
        <div class="perfil-avatar" style="background:${u.cor}">${u.nome.charAt(0).toUpperCase()}</div>
        <span class="perfil-card__nome">${escHTML(u.nome)}</span>
      `;
      card.addEventListener('click', () => entrarPerfil(u));
      listaPerfis.appendChild(card);
    }
  }

  async function criarPerfil() {
    const nome = inputNomePerfil.value.trim();
    if (!nome) return;
    try {
      const r = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, cor: corPerfilSelecionada })
      });
      const user = await r.json();
      if (user.id) {
        usuariosCache.push(user);
        modalCriarPerfil.style.display = 'none';
        inputNomePerfil.value = '';
        entrarPerfil(user);
      }
    } catch { /* ignore */ }
  }

  async function entrarPerfil(user) {
    usuarioAtual = user;
    localStorage.setItem('homeflix_userId', user.id);
    telaPerfil.style.display = 'none';
    appContainer.style.display = '';

    avatarPerfil.style.background = user.cor;
    avatarPerfil.textContent = user.nome.charAt(0).toUpperCase();
    nomePerfil.textContent = user.nome;

    // carrega dados do usuario
    await Promise.all([carregarVideos(), carregarWatch(), carregarCategorias()]);
    extrairTodasCategorias();
    renderizarBarraFiltros();
  }

  function sairPerfil() {
    usuarioAtual = null;
    localStorage.removeItem('homeflix_userId');
    mostrarTelaPerfil();
  }

  // ============================================================
  //  DADOS
  // ============================================================
  async function carregarVideos() {
    mostrarEstado(carregando);
    try {
      const r = await fetch('/api/movies');
      const d = await r.json();
      todosVideos = d.filmes || [];
      if (!todosVideos.length) { mostrarEstado(vazio); return; }
      renderizarPrincipal(todosVideos);
    } catch {
      mostrarEstado(vazio);
    }
  }

  async function carregarWatch() {
    if (!usuarioAtual) return;
    try {
      const r = await fetch(`/api/watch/${usuarioAtual.id}`);
      dadosWatch = await r.json();
    } catch { dadosWatch = {}; }
  }

  async function carregarCategorias() {
    if (!usuarioAtual) return;
    try {
      const r = await fetch(`/api/categories/${usuarioAtual.id}`);
      dadosCategorias = await r.json();
    } catch { dadosCategorias = {}; }
  }

  async function carregarConfig() {
    try {
      const r = await fetch('/api/config');
      const d = await r.json();
      inputPastaMedia.value = d.pastaMedia || '';
      setStatusConfig(d);
    } catch { /* ignore */ }
  }

  function setStatusConfig(d) {
    $('#statusPasta').textContent = d.pastaMedia || '--';
    $('#statusExiste').textContent = d.pastaExiste ? 'Sim' : 'Nao';
    $('#statusVideos').textContent = d.totalVideos ?? '--';
  }

  async function salvarPasta() {
    const msg = $('#mensagemConfig');
    msg.style.display = 'none';
    const caminho = inputPastaMedia.value.trim();
    if (!caminho) return;
    try {
      const r = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pastaMedia: caminho })
      });
      const d = await r.json();
      if (!r.ok) { mostrarMsgConfig(d.erro, false); return; }
      mostrarMsgConfig(d.mensagem || 'Salvo com sucesso!', true);
      setStatusConfig(d);
      await carregarVideos();
    } catch {
      mostrarMsgConfig('Erro de conexao.', false);
    }
  }

  function mostrarMsgConfig(texto, ok) {
    const msg = $('#mensagemConfig');
    msg.textContent = texto;
    msg.className = 'config__mensagem ' + (ok ? 'config__mensagem--ok' : 'config__mensagem--erro');
    msg.style.display = 'block';
  }

  // ============================================================
  //  WATCH (assistidos)
  // ============================================================
  function isAssistido(videoId) {
    return dadosWatch[videoId] && dadosWatch[videoId].assistido;
  }

  function getProgresso(videoId) {
    return (dadosWatch[videoId] && dadosWatch[videoId].progresso) || 0;
  }

  async function marcarAssistido(videoId, valor) {
    if (!usuarioAtual) return;
    const assistido = valor !== undefined ? valor : true;
    try {
      await fetch(`/api/watch/${usuarioAtual.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, assistido, progresso: assistido ? 100 : 0 })
      });
      dadosWatch[videoId] = { assistido, progresso: assistido ? 100 : 0, ultimaVez: new Date().toISOString() };
    } catch { /* ignore */ }
  }

  async function toggleAssistido(videoId) {
    const atual = isAssistido(videoId);
    await marcarAssistido(videoId, !atual);
    if (serieSelecionada) abrirSerie(serieSelecionada);
  }

  async function salvarProgresso(videoId, progresso) {
    if (!usuarioAtual) return;
    try {
      await fetch(`/api/watch/${usuarioAtual.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, progresso, assistido: progresso >= 95 })
      });
      dadosWatch[videoId] = { assistido: progresso >= 95, progresso, ultimaVez: new Date().toISOString() };
    } catch { /* ignore */ }
  }

  // ============================================================
  //  CATEGORIAS
  // ============================================================
  function extrairTodasCategorias() {
    const cats = new Set();
    for (const show in dadosCategorias) {
      for (const c of dadosCategorias[show]) cats.add(c);
    }
    todasCategorias = [...cats].sort();
  }

  function getCategoriasShow(show) {
    return dadosCategorias[show] || [];
  }

  async function setCategoriasShow(show, categorias) {
    if (!usuarioAtual) return;
    try {
      await fetch(`/api/categories/${usuarioAtual.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show, categorias })
      });
      dadosCategorias[show] = categorias;
      extrairTodasCategorias();
      renderizarBarraFiltros();
    } catch { /* ignore */ }
  }

  function renderizarBarraFiltros() {
    if (!todasCategorias.length) { barraFiltros.style.display = 'none'; return; }
    barraFiltros.style.display = '';
    listaFiltros.innerHTML = '';

    // pill "Limpar"
    if (filtroCategoriaAtiva) {
      const limpar = document.createElement('button');
      limpar.className = 'filtro-pill filtro-pill--limpar';
      limpar.textContent = 'Limpar filtro';
      limpar.addEventListener('click', () => { filtroCategoriaAtiva = null; renderizarBarraFiltros(); renderizarPrincipal(todosVideos); });
      listaFiltros.appendChild(limpar);
    }

    for (const cat of todasCategorias) {
      const pill = document.createElement('button');
      pill.className = 'filtro-pill' + (filtroCategoriaAtiva === cat ? ' filtro-pill--ativo' : '');
      pill.textContent = cat;
      pill.addEventListener('click', () => {
        filtroCategoriaAtiva = filtroCategoriaAtiva === cat ? null : cat;
        renderizarBarraFiltros();
        renderizarPrincipal(todosVideos);
      });
      listaFiltros.appendChild(pill);
    }
  }

  function renderizarCatsTagsShow(show) {
    const cats = getCategoriasShow(show);
    serieCatsTags.innerHTML = '';
    for (const c of cats) {
      const span = document.createElement('span');
      span.className = 'serie-cat-tag';
      span.textContent = c;
      serieCatsTags.appendChild(span);
    }
  }

  // -- modal categorias --
  function abrirModalCategorias() {
    if (!serieSelecionada) return;
    catsEditandoShow = serieSelecionada;
    catsShowNome.textContent = serieSelecionada;
    modalCategorias.style.display = 'flex';
    inputNovaCat.value = '';
    renderizarModalCats();
  }

  function renderizarModalCats() {
    const atribuidas = getCategoriasShow(catsEditandoShow);

    // todas as categorias disponiveis
    listaCatsDisponiveis.innerHTML = '';
    const catsParaMostrar = todasCategorias.length ? todasCategorias : ['Acao','Comedia','Drama','Ficcao','Terror','Romance','Animacao','Documentario','Suspense','Aventura'];
    for (const c of catsParaMostrar) {
      const tag = document.createElement('span');
      const jaAtribuida = atribuidas.includes(c);
      tag.className = 'cat-tag' + (jaAtribuida ? ' cat-tag--atribuida' : '');
      tag.textContent = c;
      tag.addEventListener('click', () => toggleCategoria(c));
      listaCatsDisponiveis.appendChild(tag);
    }

    // categorias atribuidas
    listaCatsAtribuidas.innerHTML = '';
    for (const c of atribuidas) {
      const tag = document.createElement('span');
      tag.className = 'cat-tag cat-tag--atribuida';
      tag.innerHTML = `${escHTML(c)} <span class="cat-tag__remover">&times;</span>`;
      tag.addEventListener('click', () => toggleCategoria(c));
      listaCatsAtribuidas.appendChild(tag);
    }
  }

  async function toggleCategoria(cat) {
    if (!catsEditandoShow) return;
    let cats = getCategoriasShow(catsEditandoShow);
    if (cats.includes(cat)) {
      cats = cats.filter(c => c !== cat);
    } else {
      cats.push(cat);
    }
    await setCategoriasShow(catsEditandoShow, cats);
    renderizarModalCats();
    if (serieSelecionada) renderizarCatsTagsShow(serieSelecionada);
  }

  async function adicionarCategoriaGlobal() {
    const nome = inputNovaCat.value.trim();
    if (!nome) return;
    if (!todasCategorias.includes(nome)) {
      todasCategorias.push(nome);
      todasCategorias.sort();
    }
    if (catsEditandoShow && !getCategoriasShow(catsEditandoShow).includes(nome)) {
      await toggleCategoria(nome);
    }
    inputNovaCat.value = '';
    renderizarModalCats();
  }

  // ============================================================
  //  NAVEGACAO
  // ============================================================
  function mostrarEstado(el) {
    [carregando, vazio, telaPrincipal, telaSerie, playerTela].forEach(e => e.style.display = 'none');
    el.style.display = '';
  }

  function irParaPrincipal() {
    serieSelecionada = null;
    fecharPlayer();
    renderizarPrincipal(todosVideos);
    campoBusca.value = '';
  }

  // ============================================================
  //  TELA PRINCIPAL
  // ============================================================
  function renderizarPrincipal(lista) {
    mostrarEstado(telaPrincipal);

    let listaFinal = lista;
    if (filtroCategoriaAtiva) {
      listaFinal = lista.filter(v => {
        const cats = getCategoriasShow(v.show || v.titulo);
        return cats.includes(filtroCategoriaAtiva);
      });
    }

    const grupos = {};
    for (const v of listaFinal) {
      const chave = v.show || v.titulo;
      if (!grupos[chave]) grupos[chave] = { show: chave, itens: [], temporadaMax: 0 };
      grupos[chave].itens.push(v);
      if (v.numTemporada > grupos[chave].temporadaMax) grupos[chave].temporadaMax = v.numTemporada;
    }
    const itens = Object.values(grupos).sort((a, b) => a.show.localeCompare(b.show));

    gradeShows.innerHTML = '';
    for (const g of itens) {
      const card = document.createElement('div');
      card.className = 'card-show';
      const ep = g.itens[0];
      const numTemporadas = new Set(g.itens.filter(i => i.numTemporada).map(i => i.numTemporada)).size;
      const labelTemp = numTemporadas > 1 ? `${numTemporadas} temporadas` : numTemporadas === 1 ? '1 temporada' : `${g.itens.length} episodios`;

      // checa se todos da serie estao assistidos
      const todosAssistidos = g.itens.every(v => isAssistido(v.id));
      const algunsAssistidos = g.itens.some(v => isAssistido(v.id)) && !todosAssistidos;

      // categorias
      const cats = getCategoriasShow(g.show);
      let catsHtml = '';
      if (cats.length) {
        catsHtml = '<div class="card-show__cats">' + cats.slice(0, 3).map(c => `<span class="card-cat-tag">${escHTML(c)}</span>`).join('') + '</div>';
      }

      let badgeHtml = '';
      if (numTemporadas > 1) badgeHtml = `<span class="card-show__badge">${numTemporadas}T</span>`;
      else if (todosAssistidos && g.itens.length > 1) badgeHtml = `<span class="card-show__badge" style="background:#059669">OK</span>`;

      let assistidoHtml = '';
      if (todosAssistidos && g.itens.length > 1) {
        assistidoHtml = `<span class="card-show__assistido"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20,6 9,17 4,12"/></svg> Assistido</span>`;
      } else if (algunsAssistidos && g.itens.length > 1) {
        assistidoHtml = `<span class="card-show__assistido" style="color:#d97706"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg> Parcial</span>`;
      }

      card.innerHTML = `
        <img class="card-show__thumb" src="${ep.thumbnail}" alt="${g.show}" loading="lazy">
        <div class="card-show__overlay">
          <span class="card-show__nome">${escHTML(g.show)}</span>
          <span class="card-show__temporadas">${labelTemp}</span>
        </div>
        ${assistidoHtml}
        ${badgeHtml}
        ${catsHtml}
      `;
      card.addEventListener('click', () => abrirSerie(g.show));
      gradeShows.appendChild(card);
    }
  }

  // ============================================================
  //  TELA DA SERIE
  // ============================================================
  function abrirSerie(nomeShow) {
    serieSelecionada = nomeShow;
    mostrarEstado(telaSerie);
    $('#serieNome').textContent = nomeShow;

    const eps = todosVideos.filter(v => (v.show || v.titulo) === nomeShow);
    const numTemporadas = [...new Set(eps.filter(e => e.numTemporada).map(e => e.numTemporada))].length;
    $('#serieInfo').textContent = numTemporadas > 1
      ? `${numTemporadas} temporadas - ${eps.length} episodios`
      : `${eps.length} episodios`;

    renderizarCatsTagsShow(nomeShow);

    const porTemp = {};
    for (const ep of eps) {
      const chave = ep.numTemporada || 1;
      if (!porTemp[chave]) porTemp[chave] = [];
      porTemp[chave].push(ep);
    }
    const chavesTemp = Object.keys(porTemp).map(Number).sort((a, b) => a - b);

    listaTemporadas.innerHTML = '';
    for (const t of chavesTemp) {
      const bloco = document.createElement('div');
      bloco.className = 'bloco-temporada';
      const titulo = porTemp[t].length && porTemp[t][0].temporada ? porTemp[t][0].temporada : `Temporada ${t}`;
      bloco.innerHTML = `<h3 class="temporada-titulo">${escHTML(titulo)}</h3>`;

      const grid = document.createElement('div');
      grid.className = 'lista-episodios';
      for (const ep of porTemp[t]) {
        const assistido = isAssistido(ep.id);
        const card = document.createElement('div');
        card.className = 'ep-card' + (assistido ? ' ep-card--assistido' : '');
        card.innerHTML = `
          <img class="ep-card__thumb" src="${ep.thumbnail}" alt="" loading="lazy">
          <div class="ep-card__corpo">
            <div class="ep-card__numero">${escHTML(ep.titulo)}</div>
            <div class="ep-card__nome">${escHTML(ep.titulo)}</div>
            <div class="ep-card__meta">${ep.tamanho} - ${ep.extensao.toUpperCase().replace('.', '')}</div>
          </div>
          <button class="ep-card__toggle ${assistido ? 'ep-card__toggle--on' : ''}" title="${assistido ? 'Marcar nao assistido' : 'Marcar assistido'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20,6 9,17 4,12"/></svg>
          </button>
          <button class="ep-card__play">&#9654;</button>
        `;
        const toggleBtn = card.querySelector('.ep-card__toggle');
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleAssistido(ep.id);
        });
        card.addEventListener('click', (e) => {
          if (e.target.closest('.ep-card__toggle')) return;
          e.stopPropagation();
          abrirPlayer(ep, porTemp[t], t);
        });
        grid.appendChild(card);
      }
      bloco.appendChild(grid);
      listaTemporadas.appendChild(bloco);
    }
  }

  // ============================================================
  //  PLAYER
  // ============================================================
  function abrirPlayer(ep, epsTemporada, numTemp) {
    episodiosAtuais = epsTemporada;
    indiceEpAtual = epsTemporada.findIndex(e => e.id === ep.id);
    temporadaAtual = numTemp;
    proximoEpMostrado = false;
    proximoEpOverlay.style.display = 'none';

    playerTela.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    playerShowNome.textContent = ep.show || ep.titulo;
    playerEpInfo.textContent = ep.temporada ? `${ep.temporada} - ${ep.titulo}` : ep.titulo;
    playerEpTitulo.textContent = ep.titulo;
    playerEpMeta.textContent = `${ep.tamanho} - ${ep.extensao.toUpperCase().replace('.', '')}`;

    videoPlayer.src = `/api/stream/${ep.id}`;
    videoPlayer.load();
    videoPlayer.play().catch(() => {});

    // barra de episodios
    playerEpLista.innerHTML = '';
    for (const e of epsTemporada) {
      const btn = document.createElement('button');
      const feito = isAssistido(e.id);
      btn.className = 'player-ep-btn' + (e.id === ep.id ? ' player-ep-btn--ativo' : '') + (feito ? ' player-ep-btn--feito' : '');
      btn.textContent = e.titulo;
      btn.addEventListener('click', () => abrirPlayer(e, epsTemporada, numTemp));
      playerEpLista.appendChild(btn);
    }

    requestAnimationFrame(() => {
      const ativo = playerEpLista.querySelector('.player-ep-btn--ativo');
      if (ativo) ativo.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });

    iniciarChecagemProximo();
    iniciarSalvamentoProgresso(ep);
  }

  function fecharPlayer() {
    playerTela.style.display = 'none';
    document.body.style.overflow = '';
    videoPlayer.pause();
    videoPlayer.removeAttribute('src');
    videoPlayer.load();
    pararChecagemProximo();
    pararSalvamentoProgresso();
    proximoEpOverlay.style.display = 'none';
    proximoEpMostrado = false;
  }

  // ============================================================
  //  PROXIMO EPISODIO
  // ============================================================
  function iniciarChecagemProximo() {
    pararChecagemProximo();
    proximoEpMostrado = false;
    tempoCheckId = setInterval(() => {
      if (!videoPlayer.duration || videoPlayer.paused || proximoEpMostrado) return;
      const restante = videoPlayer.duration - videoPlayer.currentTime;
      if (restante <= 30 && restante > 0 && indiceEpAtual < episodiosAtuais.length - 1) {
        mostrarProximoEp();
      }
    }, 1000);
  }

  function pararChecagemProximo() {
    if (tempoCheckId) { clearInterval(tempoCheckId); tempoCheckId = null; }
  }

  function mostrarProximoEp() {
    proximoEpMostrado = true;
    const proximo = episodiosAtuais[indiceEpAtual + 1];
    if (!proximo) return;
    proximoEpNome.textContent = proximo.titulo;
    proximoEpOverlay.style.display = 'flex';
  }

  function proximoEpSim() {
    const proximo = episodiosAtuais[indiceEpAtual + 1];
    if (!proximo) return;
    proximoEpOverlay.style.display = 'none';
    proximoEpMostrado = false;
    abrirPlayer(proximo, episodiosAtuais, temporadaAtual);
  }

  // ============================================================
  //  SALVAMENTO AUTOMATICO DE PROGRESSO
  // ============================================================
  let progressoIntervalId = null;
  let videoAtualId = null;
  let onEndHandler = null;

  function iniciarSalvamentoProgresso(ep) {
    pararSalvamentoProgresso();
    videoAtualId = ep.id;

    progressoIntervalId = setInterval(() => {
      if (!videoPlayer.duration || videoPlayer.paused) return;
      const pct = Math.round((videoPlayer.currentTime / videoPlayer.duration) * 100);
      if (pct > 0) salvarProgresso(videoAtualId, pct);
    }, 5000);

    onEndHandler = async () => {
      await marcarAssistido(videoAtualId);
      pararSalvamentoProgresso();
      if (serieSelecionada) abrirSerie(serieSelecionada);
    };
    videoPlayer.addEventListener('ended', onEndHandler, { once: true });
  }

  function pararSalvamentoProgresso() {
    if (progressoIntervalId) { clearInterval(progressoIntervalId); progressoIntervalId = null; }
    if (onEndHandler) { videoPlayer.removeEventListener('ended', onEndHandler); onEndHandler = null; }
    if (videoAtualId && videoPlayer.duration && !videoPlayer.ended) {
      const pct = Math.round((videoPlayer.currentTime / videoPlayer.duration) * 100);
      if (pct > 0) salvarProgresso(videoAtualId, pct);
    }
    videoAtualId = null;
  }

  // ============================================================
  //  BUSCA
  // ============================================================
  function onBusca() {
    const q = campoBusca.value.trim().toLowerCase();
    if (!q) { renderizarPrincipal(todosVideos); return; }
    const filtrados = todosVideos.filter(v => {
      const texto = [v.titulo, v.show, v.temporada, v.caminhoCompleto, v.categoria]
        .filter(Boolean).join(' ').toLowerCase();
      return texto.includes(q);
    });
    renderizarPrincipal(filtrados);
  }

  // ============================================================
  //  UTILS
  // ============================================================
  function escHTML(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // inicia quando DOM pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { init(); carregarConfig(); });
  } else {
    init();
    carregarConfig();
  }

})();
