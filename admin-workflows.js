(function () {
  'use strict';

  const attachmentDatabase = 'mt-legit-web-attachments';
  const attachmentStore = 'attachments';
  let calendarMonth = new Date();
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);

  function openAttachmentDatabase() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) {
        reject(new Error('O armazenamento de arquivos não está disponível neste navegador.'));
        return;
      }
      const request = indexedDB.open(attachmentDatabase, 1);
      request.onupgradeneeded = function () {
        const database = request.result;
        if (!database.objectStoreNames.contains(attachmentStore)) {
          database.createObjectStore(attachmentStore, { keyPath: 'id' });
        }
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function storeAttachment(id, file) {
    return openAttachmentDatabase().then(function (database) {
      return new Promise(function (resolve, reject) {
        const transaction = database.transaction(attachmentStore, 'readwrite');
        transaction.objectStore(attachmentStore).put({ id: id, blob: file });
        transaction.oncomplete = function () { database.close(); resolve(); };
        transaction.onerror = function () { database.close(); reject(transaction.error); };
        transaction.onabort = function () { database.close(); reject(transaction.error); };
      });
    });
  }

  function getAttachment(id) {
    return openAttachmentDatabase().then(function (database) {
      return new Promise(function (resolve, reject) {
        const request = database.transaction(attachmentStore, 'readonly').objectStore(attachmentStore).get(id);
        request.onsuccess = function () { database.close(); resolve(request.result || null); };
        request.onerror = function () { database.close(); reject(request.error); };
      });
    });
  }

  function deleteAttachment(id) {
    return openAttachmentDatabase().then(function (database) {
      return new Promise(function (resolve, reject) {
        const transaction = database.transaction(attachmentStore, 'readwrite');
        transaction.objectStore(attachmentStore).delete(id);
        transaction.oncomplete = function () { database.close(); resolve(); };
        transaction.onerror = function () { database.close(); reject(transaction.error); };
      });
    });
  }

  function clearAttachments() {
    return openAttachmentDatabase().then(function (database) {
      return new Promise(function (resolve, reject) {
        const transaction = database.transaction(attachmentStore, 'readwrite');
        transaction.objectStore(attachmentStore).clear();
        transaction.oncomplete = function () { database.close(); resolve(); };
        transaction.onerror = function () { database.close(); reject(transaction.error); };
      });
    }).catch(function () {});
  }

  window.deleteStoredFile = deleteAttachment;

  function formatBytes(size) {
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(0) + ' KB';
    return (size / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function nextFileId() {
    let max = 0;
    state.files.forEach(function (file) {
      const number = Number(String(file.id || '').match(/(\d+)$/)?.[1] || 0);
      max = Math.max(max, number);
    });
    return 'ARQ-' + String(max + 1).padStart(3, '0');
  }

  function fileCategories() {
    return Array.from(new Set(state.files.map(function (file) {
      return String(file.category || '').trim();
    }).filter(Boolean))).sort(function (a, b) {
      return a.localeCompare(b, 'pt-BR');
    });
  }

  window.filesPage = function filesPage() {
    const categories = fileCategories();
    const records = filtered(state.files).filter(function (file) {
      return !state.fileCategory || file.category === state.fileCategory;
    });
    const tabs = '<button class="tab-button ' + (!state.fileCategory ? 'active' : '') +
      '" data-file-category="">Todos (' + state.files.length + ')</button>' +
      categories.map(function (category) {
        const count = state.files.filter(function (file) { return file.category === category; }).length;
        return '<button class="tab-button ' + (state.fileCategory === category ? 'active' : '') +
          '" data-file-category="' + esc(category) + '">' + esc(category) + ' (' + count + ')</button>';
      }).join('');
    const rows = records.map(function (file) {
      return '<div class="file-row"><span class="file-icon">' + icon('doc') +
        '</span><span class="file-row-main"><strong>' + esc(file.name) + '</strong><small>' +
        esc(file.category) + ' · ' + esc(file.client || 'Sem cliente vinculado') + '</small></span><small>' +
        esc(file.date) + ' · ' + esc(file.size) + '</small><div class="row-actions">' +
        '<button class="row-action" data-action="download-file" data-id="' + esc(file.id) + '">Baixar</button>' +
        '<button class="row-action" data-action="view" data-entity="file" data-id="' + esc(file.id) + '">Detalhes</button>' +
        '</div></div>';
    }).join('');
    const empty = '<div class="empty-state"><span>' + icon('folder') +
      '</span><strong>Nenhum arquivo neste filtro</strong><p>Adicione um briefing, contrato ou material do projeto.</p></div>';

    return pageHeading('Arquivos', 'Guarde materiais no navegador e associe-os aos clientes.', '') +
      '<section class="panel file-upload-panel"><div class="panel-heading"><div><h2>Adicionar arquivo</h2>' +
      '<p>Os anexos ficam neste navegador, fora do armazenamento dos registros.</p></div></div>' +
      '<form id="file-upload-form" class="file-upload-form"><div class="field"><label for="file-category">Categoria</label>' +
      '<select id="file-category" name="category" required><option>Briefing</option><option>Proposta</option>' +
      '<option>Aprovação</option><option>Contrato</option><option>Material</option><option>Outro</option></select></div>' +
      '<div class="field"><label for="file-client">Cliente / projeto</label><input id="file-client" name="client" type="text" placeholder="Opcional" /></div>' +
      '<div class="field file-picker-field"><label for="file-attachment">Arquivo</label><input id="file-attachment" name="attachment" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.svg,.txt,.zip" required /></div>' +
      '<button class="primary-button compact" type="submit">' + icon('plus') + 'Adicionar ao arquivo</button></form></section>' +
      '<section class="panel file-list-panel"><div class="page-toolbar"><div class="tab-list">' + tabs +
      '</div>' + tableSearch() + '</div><div class="file-list">' + (rows || empty) +
      '</div><p class="small-label file-storage-note">Os arquivos e registros ficam apenas neste navegador. Use hospedagem segura e cópias externas para manter seus dados disponíveis em outros dispositivos.</p></section>';
  };

  function calendarEventsForMonth(prefix) {
    const sources = [
      ['tasks', 'date', 'task', function (item) { return item.title; }],
      ['projects', 'deadline', 'project', function (item) { return item.name; }],
      ['services', 'renewal', 'service', function (item) { return item.service + ' · ' + item.client; }],
      ['domains', 'renew', 'domain', function (item) { return item.domain + ' · renovação'; }],
      ['invoices', 'due', 'invoice', function (item) { return item.client + ' · fatura'; }]
    ];
    const events = [];
    sources.forEach(function (source) {
      state[source[0]].forEach(function (item) {
        const date = String(item[source[1]] || '').slice(0, 10);
        if (date.slice(0, 7) !== prefix) return;
        events.push({
          id: item.id,
          entity: source[2],
          title: source[3](item),
          date: date,
          completed: item.status === 'Concluída' || item.status === 'Paga'
        });
      });
    });
    return events;
  }

  window.calendarPage = function calendarPage() {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prefix = year + '-' + String(month + 1).padStart(2, '0');
    const today = new Date();
    const todayKey = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') +
      '-' + String(today.getDate()).padStart(2, '0');
    const events = calendarEventsForMonth(prefix);
    const weekdayHeaders = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(function (day) {
      return '<div class="calendar-cell header">' + day + '</div>';
    }).join('');
    let cells = '';
    for (let blank = 0; blank < firstDay; blank++) cells += '<div class="calendar-cell empty-day"></div>';
    for (let day = 1; day <= daysInMonth; day++) {
      const date = prefix + '-' + String(day).padStart(2, '0');
      const dayEvents = events.filter(function (event) { return event.date === date; });
      const eventButtons = dayEvents.slice(0, 3).map(function (event) {
        return '<button class="calendar-event ' + (event.completed ? 'event-complete' : '') +
          '" data-action="view" data-entity="' + event.entity + '" data-id="' + esc(event.id) +
          '" title="' + esc(event.title) + '">' + esc(event.title) + '</button>';
      }).join('');
      const extraCount = dayEvents.length > 3
        ? '<small class="calendar-more">+' + (dayEvents.length - 3) + ' mais</small>'
        : '';
      cells += '<div class="calendar-cell day-cell ' + (date === todayKey ? 'today' : '') +
        (dayEvents.length ? ' has-events' : '') + '"><span class="calendar-day-number">' + day +
        '</span>' + eventButtons + extraCount + '</div>';
    }

    const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(calendarMonth);
    const heading = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    const empty = events.length
      ? ''
      : '<div class="calendar-empty"><span>' + icon('calendar') + '</span><strong>Sem prazos neste mês</strong>' +
        '<small>Crie tarefas ou defina prazos nos projetos para vê-los aqui.</small></div>';

    return pageHeading('Calendário', 'Prazos de tarefas, projetos, recorrências, domínios e faturas.', buttonNew('task', 'Nova tarefa')) +
      '<section class="panel"><div class="calendar-heading"><div><h2>' + esc(heading) + '</h2><p>' +
      events.length + ' compromisso(s) neste mês</p></div><div class="calendar-month-nav">' +
      '<button type="button" data-action="calendar-prev" aria-label="Mês anterior">‹</button><button type="button" data-action="calendar-next" aria-label="Próximo mês">›</button>' +
      '</div></div><div class="calendar-grid">' + weekdayHeaders + cells + '</div>' + empty + '</section>';
  };

  window.settingsPage = function settingsPage() {
    const overdue = state.invoices.filter(function (invoice) { return invoice.status === 'Atrasada'; }).length;
    return pageHeading('Configurações', 'Identidade, preferências e armazenamento.', '') +
      '<div class="settings-grid"><nav class="panel settings-nav" aria-label="Seções de configuração">' +
      '<a href="#studio-identity">Perfil do estúdio</a><a href="#studio-preferences">Preferências</a>' +
      '<a href="#studio-notifications">Notificações</a><a href="#studio-data">Dados e privacidade</a></nav>' +
      '<div class="settings-sections"><section class="panel" id="studio-identity"><div class="panel-heading"><div><h2>Identidade do estúdio</h2><p>Dados de apresentação</p></div></div>' +
      '<div class="form-grid"><div class="field"><label>Marca</label><input value="MT LEGIT Web" readonly /></div>' +
      '<div class="field"><label>Moeda</label><input value="Real brasileiro (BRL)" readonly /></div>' +
      '<div class="field"><label>Idioma</label><input value="Português do Brasil" readonly /></div>' +
      '<div class="field"><label>Fuso horário</label><input value="America/Sao_Paulo" readonly /></div></div></section>' +
      '<section class="panel" id="studio-preferences"><div class="panel-heading"><div><h2>Preferências</h2><p>Interface adaptável ao seu navegador</p></div></div>' +
      '<div class="setting-row"><div><strong>Aparência</strong><small>Tema escuro MT LEGIT Web</small></div><span class="status-pill neutral">Ativo</span></div>' +
      '<div class="setting-row"><div><strong>Movimento</strong><small>Respeita a preferência de movimento reduzido do sistema</small></div><span class="status-pill neutral">Automático</span></div></section>' +
      '<section class="panel" id="studio-notifications"><div class="panel-heading"><div><h2>Notificações</h2><p>Avisos calculados a partir dos seus registros</p></div></div>' +
      '<div class="setting-row"><div><strong>Faturas atrasadas</strong><small>' + (overdue ? 'Há cobranças que precisam de atenção.' : 'Nenhuma fatura atrasada.') +
      '</small></div><span class="status-pill ' + (overdue ? 'overdue' : 'neutral') + '">' + overdue + '</span></div></section>' +
      '<section class="panel" id="studio-data"><div class="panel-heading"><div><h2>Dados e privacidade</h2><p>Controle os registros deste navegador</p></div></div>' +
      '<div class="setting-row"><div><strong>Armazenamento</strong><small>Cadastros no armazenamento local; anexos no banco local do navegador.</small></div><span class="status-pill pending">Local</span></div>' +
      '<div class="setting-row"><div><strong>Acesso e sincronização</strong><small>Login e banco compartilhado não estão configurados.</small></div><span class="status-pill overdue">Pendente</span></div>' +
      '<div class="setting-row"><div><strong>Proteção</strong><small>Não salve senhas, tokens ou dados bancários neste painel.</small></div><span class="status-pill neutral">Atenção</span></div>' +
      '<button class="secondary-button danger-button" data-action="clear-data">Apagar todos os registros</button></section></div></div>';
  };

  async function uploadAttachment(form) {
    const file = form.elements.namedItem('attachment').files[0];
    if (!file) {
      form.reportValidity();
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast('O limite por arquivo é 25 MB.');
      return;
    }
    const id = nextFileId();
    const record = {
      id: id,
      name: file.name,
      category: form.elements.namedItem('category').value,
      client: form.elements.namedItem('client').value.trim(),
      date: new Intl.DateTimeFormat('pt-BR').format(new Date()),
      size: formatBytes(file.size),
      type: file.type || 'Arquivo'
    };
    try {
      await storeAttachment(id, file);
      state.files.unshift(record);
      persist();
      form.reset();
      render();
      toast('Arquivo adicionado.');
    } catch (error) {
      toast('Não foi possível armazenar o arquivo neste navegador.');
    }
  }

  async function downloadAttachment(id) {
    try {
      const attachment = await getAttachment(id);
      if (!attachment || !attachment.blob) {
        toast('Arquivo não encontrado neste navegador.');
        return;
      }
      const url = URL.createObjectURL(attachment.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.blob.name || 'mt-legit-arquivo';
      link.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    } catch (error) {
      toast('Não foi possível abrir o arquivo.');
    }
  }

  document.addEventListener('click', function (event) {
    const category = event.target.closest('[data-file-category]');
    if (category) {
      event.preventDefault();
      event.stopImmediatePropagation();
      state.fileCategory = category.dataset.fileCategory || '';
      render();
      return;
    }

    const action = event.target.closest('[data-action]');
    if (!action) return;

    if (action.dataset.action === 'calendar-prev' || action.dataset.action === 'calendar-next') {
      event.preventDefault();
      event.stopImmediatePropagation();
      calendarMonth.setMonth(calendarMonth.getMonth() + (action.dataset.action === 'calendar-next' ? 1 : -1));
      render();
      return;
    }
    if (action.dataset.action === 'download-file') {
      event.preventDefault();
      event.stopImmediatePropagation();
      downloadAttachment(action.dataset.id);
      return;
    }
    if (action.dataset.action === 'clear-data') {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!confirm('Apagar todos os registros e anexos deste navegador?')) return;
      Object.keys(seed).forEach(function (key) { state[key] = []; });
      state.filters = {};
      state.search = '';
      state.clientCategory = '';
      state.fileCategory = '';
      clearAttachments().finally(function () {
        persist();
        render();
        toast('Registros e anexos removidos.');
      });
    }
  }, true);

  document.addEventListener('submit', function (event) {
    if (!event.target || event.target.id !== 'file-upload-form') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    uploadAttachment(event.target);
  }, true);

  render();
})();

