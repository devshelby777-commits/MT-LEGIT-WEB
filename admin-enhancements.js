(function () {
  'use strict';

  const recordLists = {
    lead: 'leads',
    client: 'clients',
    project: 'projects',
    quote: 'quotes',
    invoice: 'invoices',
    task: 'tasks',
    service: 'services',
    domain: 'domains',
    expense: 'expenses',
    revenue: 'revenue',
    file: 'files'
  };

  const fieldLabels = {
    name: 'Nome',
    company: 'Empresa',
    contact: 'Pessoa de contato',
    category: 'Segmento',
    email: 'E-mail',
    phone: 'Telefone / WhatsApp',
    site: 'Site',
    service: 'Serviço',
    source: 'Origem',
    status: 'Status',
    nextContact: 'Próximo contato',
    scope: 'Escopo',
    deadline: 'Prazo',
    progress: 'Progresso',
    client: 'Cliente',
    amount: 'Valor',
    valid: 'Validade',
    description: 'Descrição',
    due: 'Vencimento',
    title: 'Tarefa',
    project: 'Projeto',
    priority: 'Prioridade',
    date: 'Data',
    renewal: 'Renovação',
    domain: 'Domínio',
    provider: 'Provedor',
    renew: 'Renovação',
    ssl: 'SSL',
    backup: 'Backup',
    recurring: 'Frequência',
    method: 'Forma de recebimento',
    joined: 'Cadastrado em',
    size: 'Tamanho',
    type: 'Tipo de arquivo'
  };

  if (formFields.client && formFields.client[3]) {
    formFields.client[3] = ['phone', 'Telefone / WhatsApp', 'tel', '(11) 98765-4321'];
  }

  function phoneDigits(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function whatsappNumber(value) {
    const digits = phoneDigits(value);
    if (digits.length < 10) return '';
    return digits.startsWith('55') ? digits : '55' + digits;
  }

  function siteUrl(value) {
    const site = String(value || '').trim();
    if (!site || site === 'A definir' || site === 'Site pendente') return '';
    return /^https?:\/\//i.test(site) ? site : 'https://' + site;
  }

  function clientContactActions(client) {
    const phone = String(client.phone || '').trim();
    const digits = phoneDigits(phone);
    const whatsapp = whatsappNumber(phone);
    const email = String(client.email || '').trim();
    const site = String(client.site || '').trim();
    const url = siteUrl(site);
    const phoneLine = digits.length >= 8
      ? '<a href="tel:' + digits + '">' + esc(phone) + '</a>'
      : '<span>Telefone não informado</span>';
    const emailLine = email && email !== 'A cadastrar'
      ? '<a href="mailto:' + esc(email) + '">' + esc(email) + '</a>'
      : '<span>E-mail não informado</span>';
    const siteLine = url
      ? '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(site) + '</a>'
      : '<span>Site pendente</span>';
    const whatsappAction = whatsapp
      ? '<a href="https://wa.me/' + whatsapp + '" target="_blank" rel="noopener noreferrer">WhatsApp</a>'
      : '<span class="contact-unavailable">WhatsApp</span>';
    const callAction = digits.length >= 8
      ? '<a href="tel:' + digits + '">Ligar</a>'
      : '<span class="contact-unavailable">Ligar</span>';

    return '<div class="client-contact-lines">' + emailLine + phoneLine + siteLine + '</div>' +
      '<div class="client-contact-actions">' + whatsappAction + callAction +
      '<button type="button" data-action="view" data-entity="client" data-id="' + esc(client.id) + '">Detalhes</button></div>';
  }

  window.clientsPage = function clientsPage() {
    const allRecords = filtered(state.clients);
    const categories = Array.from(new Set(state.clients.map(function (client) {
      return String(client.category || '').trim();
    }).filter(Boolean))).sort(function (a, b) {
      return a.localeCompare(b, 'pt-BR');
    });
    const records = allRecords.filter(function (client) {
      return !state.clientCategory || client.category === state.clientCategory;
    });
    const categoryTabs = '<button class="tab-button ' + (!state.clientCategory ? 'active' : '') +
      '" data-filter-category="">Todos (' + state.clients.length + ')</button>' +
      categories.map(function (category) {
        const count = state.clients.filter(function (client) {
          return client.category === category;
        }).length;
        return '<button class="tab-button ' + (state.clientCategory === category ? 'active' : '') +
          '" data-filter-category="' + esc(category) + '">' + esc(category) + ' (' + count + ')</button>';
      }).join('');

    const cards = records.map(function (client) {
      const site = String(client.site || '').trim();
      return '<article class="client-card"><div class="client-card-top"><span class="client-card-id">' +
        esc(initials(client.name || client.company || '?')) + '</span>' + statusPill(client.status || 'Ativo') +
        '</div><h3>' + esc(client.name || client.company || 'Cliente sem nome') + '</h3><p>' +
        esc(client.category || 'Segmento não informado') + ' · ' + esc(site || 'Site pendente') +
        '</p>' + clientContactActions(client) + '</article>';
    }).join('');

    const emptyState = '<div class="empty-state"><span>' + icon('users') +
      '</span><strong>Nenhum cliente cadastrado</strong><p>Adicione os dados comerciais e o telefone para facilitar o contato.</p>' +
      '<button class="primary-button compact" data-action="new" data-entity="client">' +
      icon('plus') + 'Novo cliente</button></div>';

    return pageHeading('Clientes', 'Contatos, telefone e histórico da carteira.', buttonNew('client', 'Novo cliente')) +
      '<div class="page-toolbar"><div class="tab-list">' + categoryTabs + '</div>' + tableSearch() +
      '</div><div class="client-card-grid">' + (cards || emptyState) + '</div>';
  };

  function openEditRecord(entity, id) {
    const listName = recordLists[entity];
    const record = listName && state[listName].find(function (item) { return item.id === id; });
    if (!record || !formFields[entity]) {
      toast('Este registro não pode ser editado.');
      return;
    }

    openForm(entity);
    const form = document.querySelector('#modal-root form[data-form]');
    if (!form) return;

    form.dataset.id = record.id;
    const title = entityTitle[entity] || entity;
    form.querySelector('.modal-header h2').textContent = 'Editar ' + title;
    form.querySelector('.modal-header p').textContent = 'Atualize os dados deste registro.';
    form.querySelector('.modal-footer .primary-button').innerHTML = icon('check') + 'Salvar alterações';

    Object.keys(record).forEach(function (key) {
      const field = form.elements.namedItem(key);
      if (!field || record[key] === undefined || record[key] === null) return;
      const value = String(record[key]);
      if (field.tagName === 'SELECT' && !Array.from(field.options).some(function (option) {
        return option.value === value;
      })) return;
      field.value = value;
    });
  }

  function saveEditedRecord(form) {
    const entity = form.dataset.form;
    const id = form.dataset.id;
    const listName = recordLists[entity];
    if (!id || !listName) {
      createFromForm(form);
      return;
    }

    const index = state[listName].findIndex(function (item) { return item.id === id; });
    if (index < 0) {
      toast('Registro não encontrado.');
      closeModal();
      return;
    }

    const previous = state[listName][index];
    const data = Object.fromEntries(new FormData(form).entries());
    if (data.amount !== undefined) data.amount = Number(data.amount) || 0;
    if (data.progress !== undefined) data.progress = Math.min(100, Math.max(0, Number(data.progress) || 0));
    data.id = id;
    if (entity === 'client') data.joined = previous.joined || 'Hoje';

    state[listName][index] = Object.assign({}, previous, data);
    if (entity === 'invoice' && previous.status !== 'Paga' && data.status === 'Paga') {
      setPaid(id);
      return;
    }

    persist();
    closeModal();
    render();
    toast((entityTitle[entity] || 'Registro') + ' atualizado.');
  }

  function showRecordDetails(entity, id) {
    const listName = recordLists[entity];
    const record = listName && state[listName].find(function (item) { return item.id === id; });
    if (!record) {
      toast('Registro não encontrado.');
      return;
    }

    const title = record.name || record.company || record.client || record.domain || record.title ||
      record.description || record.service || record.id;
    const details = Object.entries(record).filter(function (entry) {
      return entry[0] !== 'id' && entry[0] !== 'dataUrl';
    }).map(function (entry) {
      const key = entry[0];
      const value = entry[1];
      const label = fieldLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, function (letter) {
        return letter.toUpperCase();
      });

      if (key === 'phone' && phoneDigits(value).length >= 8) {
        const number = phoneDigits(value);
        const wa = whatsappNumber(value);
        return '<div class="setting-row"><div><strong>' + esc(label) + '</strong></div><span class="detail-contact">' +
          '<a href="tel:' + number + '">' + esc(value) + '</a>' +
          (wa ? ' · <a href="https://wa.me/' + wa + '" target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a>' : '') +
          '</span></div>';
      }
      if (key === 'email' && value) {
        return '<div class="setting-row"><div><strong>' + esc(label) + '</strong></div><span><a href="mailto:' +
          esc(value) + '">' + esc(value) + '</a></span></div>';
      }
      if (key === 'site' && siteUrl(value)) {
        return '<div class="setting-row"><div><strong>' + esc(label) + '</strong></div><span><a href="' +
          esc(siteUrl(value)) + '" target="_blank" rel="noopener noreferrer">' + esc(value) + '</a></span></div>';
      }
      const shownValue = key === 'amount' ? money(value) : String(value == null ? '' : value);
      return '<div class="setting-row"><div><strong>' + esc(label) + '</strong></div><span>' +
        esc(shownValue) + '</span></div>';
    }).join('');

    const editButton = formFields[entity]
      ? '<button class="secondary-button" data-action="edit-record" data-entity="' + esc(entity) +
        '" data-id="' + esc(id) + '">Editar</button>'
      : '';
    const paidButton = entity === 'invoice' && record.status !== 'Paga'
      ? '<button class="primary-button" data-action="mark-paid" data-id="' + esc(id) + '">' +
        icon('check') + 'Marcar como paga</button>'
      : '';
    const downloadButton = entity === 'file'
      ? '<button class="secondary-button" data-action="download-file" data-id="' + esc(id) + '">Baixar arquivo</button>'
      : '';

    document.getElementById('modal-root').innerHTML =
      '<div class="modal-backdrop" data-action="close-modal"><div class="modal" role="dialog" aria-modal="true">' +
      '<div class="modal-header"><div><span class="eyebrow">' + esc(record.id) + '</span><h2>' +
      esc(title) + '</h2></div><button class="modal-close" data-action="close-modal" aria-label="Fechar">×</button></div>' +
      '<div class="modal-body">' + details + '</div><div class="modal-footer">' +
      '<button class="secondary-button" data-action="close-modal">Fechar</button>' + editButton + downloadButton +
      '<button class="secondary-button danger-button" data-action="delete-record" data-entity="' +
      esc(entity) + '" data-id="' + esc(id) + '">Excluir</button>' + paidButton +
      '</div></div></div>';
  }

  function deleteRecord(entity, id) {
    const listName = recordLists[entity];
    if (!listName) return;
    const record = state[listName].find(function (item) { return item.id === id; });
    if (!record) {
      toast('Registro não encontrado.');
      return;
    }

    const warning = entity === 'invoice' && record.status === 'Paga'
      ? ' A receita já lançada será mantida.'
      : '';
    if (!confirm('Excluir este registro?' + warning)) return;

    if (entity === 'file' && window.deleteStoredFile) window.deleteStoredFile(id).catch(function () {});
    state[listName] = state[listName].filter(function (item) { return item.id !== id; });
    persist();
    closeModal();
    render();
    toast('Registro excluído.');
  }

  document.addEventListener('click', function (event) {
    const action = event.target.closest('[data-action]');
    if (!action) return;

    if (action.dataset.action === 'view') {
      event.preventDefault();
      event.stopImmediatePropagation();
      showRecordDetails(action.dataset.entity, action.dataset.id);
    } else if (action.dataset.action === 'edit-record') {
      event.preventDefault();
      event.stopImmediatePropagation();
      openEditRecord(action.dataset.entity, action.dataset.id);
    } else if (action.dataset.action === 'delete-record') {
      event.preventDefault();
      event.stopImmediatePropagation();
      deleteRecord(action.dataset.entity, action.dataset.id);
    }
  }, true);

  document.addEventListener('submit', function (event) {
    const form = event.target.closest('[data-form]');
    if (!form) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!form.reportValidity()) return;
    saveEditedRecord(form);
  }, true);

  render();
})();

