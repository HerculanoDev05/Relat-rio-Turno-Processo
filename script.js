// =====================================================
// RELATÓRIO DE TURNO - PROCESSO ITM
// Com persistência de dados em caso de falha
// =====================================================

// Estado atual do formulário
let currentPage = 1;
const totalPages = 8;

// =====================================================
// CONFIGURAÇÃO DO WEBHOOK
// =====================================================
const WEBHOOK_CONFIG = {
  url:  'https://n8n-webhook.zzoohs.easypanel.host/webhook/formulario-solicitacao', // Ajuste para sua URL
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

// =====================================================
// MÓDULO DE PERSISTÊNCIA
// =====================================================
const FormPersistence = {
  STORAGE_KEY: 'relatorio_turno_pending',
  MAX_RETRIES: 3,
  RETRY_DELAYS: [2000, 5000, 10000],

  // Salva dados localmente
  saveLocal(dados) {
    const pending = this.getPending();
    const entry = {
      id: Date.now(),
      dados: dados,
      tentativas: 0,
      criadoEm: new Date().toISOString(),
      status: 'pendente'
    };
    pending.push(entry);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pending));
    console.log(`[Cache] Dados salvos. ID: ${entry.id}`);
    return entry.id;
  },

  getPending() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('[Cache] Erro ao ler:', e);
      return [];
    }
  },

  updateStatus(id, status, tentativas = null) {
    const pending = this.getPending();
    const index = pending.findIndex(p => p.id === id);
    if (index !== -1) {
      pending[index].status = status;
      pending[index].ultimaTentativa = new Date().toISOString();
      if (tentativas !== null) pending[index].tentativas = tentativas;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pending));
    }
  },

  removeLocal(id) {
    const pending = this.getPending().filter(p => p.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pending));
    console.log(`[Cache] ID ${id} removido após sucesso.`);
  },

  getContagemPendentes() {
    return this.getPending().length;
  },

  temPendentes() {
    return this.getPending().length > 0;
  },

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Envio com retry
  async enviarComRetry(dados, id = null) {
    if (!id) {
      id = this.saveLocal(dados);
    }

    this.updateStatus(id, 'enviando');

    for (let tentativa = 0; tentativa < this.MAX_RETRIES; tentativa++) {
      try {
        console.log(`[Envio] Tentativa ${tentativa + 1}/${this.MAX_RETRIES}`);
        
        const response = await fetch(WEBHOOK_CONFIG.url, {
          method: WEBHOOK_CONFIG.method,
          headers: WEBHOOK_CONFIG.headers,
          body: JSON.stringify(dados)
        });

        if (response.ok) {
          this.removeLocal(id);
          return { success: true, id: id };
        } else {
          throw new Error(`HTTP ${response.status}`);
        }

      } catch (error) {
        console.warn(`[Envio] Tentativa ${tentativa + 1} falhou:`, error.message);
        this.updateStatus(id, 'erro', tentativa + 1);

        if (tentativa < this.MAX_RETRIES - 1) {
          const delay = this.RETRY_DELAYS[tentativa] || 5000;
          await this.sleep(delay);
        }
      }
    }

    this.updateStatus(id, 'erro', this.MAX_RETRIES);
    return { success: false, id: id, savedLocally: true };
  },

  // Processa fila de pendentes
  async processarPendentes() {
    const pending = this.getPending();
    
    if (pending.length === 0) return { total: 0, enviados: 0, falhas: 0 };

    console.log(`[Fila] Processando ${pending.length} pendente(s)...`);
    
    let enviados = 0, falhas = 0;

    for (const entry of pending) {
      if (entry.status === 'enviando') continue;

      const result = await this.enviarComRetry(entry.dados, entry.id);
      result.success ? enviados++ : falhas++;
      
      await this.sleep(500);
    }

    return { total: pending.length, enviados, falhas };
  }
};

// =====================================================
// INICIALIZAÇÃO
// =====================================================
document.addEventListener("DOMContentLoaded", function () {
  // Setar data atual
  const dataInput = document.getElementById("data");
  if (dataInput) {
    const hoje = new Date().toISOString().split("T")[0];
    dataInput.value = hoje;
  }

  // Configurar campos "Outro"
  setupOtherFields();

  // Mostrar primeira página
  showPage(1);

  // Criar indicador de pendentes
  criarIndicadorPendentes();

  // Verificar pendentes ao carregar
  if (FormPersistence.temPendentes()) {
    const count = FormPersistence.getContagemPendentes();
    showToast(`⚠ ${count} envio(s) pendente(s) encontrado(s).`, 'error');
  }
});

// =====================================================
// NAVEGAÇÃO DE PÁGINAS
// =====================================================
function showPage(pageNumber) {
  document.querySelectorAll(".form-page").forEach((page) => {
    page.classList.remove("active");
  });

  const page = document.getElementById(`page${pageNumber}`);
  if (page) {
    page.classList.add("active");
    currentPage = pageNumber;
    window.scrollTo(0, 0);
  }
}

function nextPage() {
  const currentPageElement = document.getElementById(`page${currentPage}`);

  if (!validateCurrentPage(currentPageElement)) {
    showToast("Por favor, preencha todos os campos obrigatórios.", "error");
    return;
  }

  if (currentPage < totalPages) {
    showPage(currentPage + 1);
  }
}

function prevPage() {
  if (currentPage > 1) {
    showPage(currentPage - 1);
  }
}

// =====================================================
// VALIDAÇÃO
// =====================================================
function validateCurrentPage(pageElement) {
  const requiredTextInputs = pageElement.querySelectorAll(
    'input[required][type="text"], input[required][type="date"], input[required][type="number"]'
  );
  for (let input of requiredTextInputs) {
    if (!input.value.trim()) {
      input.focus();
      return false;
    }
  }

  const requiredRadioGroups = new Set();
  pageElement
    .querySelectorAll('input[required][type="radio"]')
    .forEach((radio) => {
      requiredRadioGroups.add(radio.name);
    });

  for (let groupName of requiredRadioGroups) {
    const checked = pageElement.querySelector(`input[name="${groupName}"]:checked`);
    if (!checked) {
      const firstRadio = pageElement.querySelector(`input[name="${groupName}"]`);
      if (firstRadio) firstRadio.focus();
      return false;
    }
  }

  return true;
}

// =====================================================
// CAMPOS "OUTRO"
// =====================================================
function setupOtherFields() {
  document.querySelectorAll(".radio-option").forEach((option) => {
    const radioInput = option.querySelector('input[type="radio"]');
    const otherInput = option.querySelector(".other-input");

    if (radioInput && otherInput) {
      radioInput.addEventListener("change", function () {
        if (this.checked) {
          otherInput.disabled = false;
          otherInput.focus();
        }
      });

      otherInput.addEventListener("focus", function () {
        radioInput.checked = true;
      });

      radioInput.addEventListener("change", function () {
        if (this.checked) {
          const groupName = this.name;
          document.querySelectorAll(`input[name="${groupName}"]`).forEach((radio) => {
            const parentOption = radio.closest(".radio-option");
            const otherField = parentOption?.querySelector(".other-input");
            if (otherField && radio !== radioInput) {
              otherField.disabled = true;
              otherField.value = "";
            }
          });
        }
      });
    }
  });
}

// =====================================================
// COLETA DE DADOS
// =====================================================
function collectFormData() {
  const formData = new FormData(document.getElementById('relatorioForm'));
  const data = {};

  for (let [key, value] of formData.entries()) {
    if (!key.startsWith('campo_') && !key.startsWith('agua_')) {
      data[key] = value;
    }
  }

  // Campos "Outro"
  document.querySelectorAll('.other-input').forEach(input => {
    const radioParent = input.closest('.radio-option');
    const radio = radioParent?.querySelector('input[type="radio"]');
    if (radio && radio.checked && input.value.trim()) {
      data[radio.name] = input.value.trim();
    }
  });

  // Agrupar WHC
  const whcEquipments = ['whc01', 'whc02', 'whc03', 'whc04', 'whc05', 'whc06', 'whc07', 'whc08', 'whc10', 'whc11', 'ghx'];
  data.whc_campo_magnetico = {};
  data.whc_agua_lavagem = {};

  whcEquipments.forEach(equipment => {
    const campoRadio = document.querySelector(`input[name="campo_${equipment}"]:checked`);
    const aguaRadio = document.querySelector(`input[name="agua_${equipment}"]:checked`);
    if (campoRadio) data.whc_campo_magnetico[equipment] = campoRadio.value;
    if (aguaRadio) data.whc_agua_lavagem[equipment] = aguaRadio.value;
  });

  // Metadados
  data.timestamp_envio = new Date().toISOString();
  data.formulario = 'Relatório de Turno - Processo';

  return data;
}

// =====================================================
// ENVIO COM PERSISTÊNCIA
// =====================================================
async function sendToWebhook(data) {
  const submitBtn = document.getElementById('submitBtn');
  const originalText = submitBtn.innerHTML;
  
  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Enviando...';

    // Usa o módulo de persistência
    const result = await FormPersistence.enviarComRetry(data);

    return result;

  } catch (error) {
    console.error('Erro ao enviar:', error);
    return { success: false, error: error.message };
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
    atualizarIndicadorPendentes();
  }
}

// =====================================================
// SUBMIT DO FORMULÁRIO
// =====================================================
document.getElementById('relatorioForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const lastPage = document.getElementById(`page${totalPages}`);
  if (!validateCurrentPage(lastPage)) {
    showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
    return;
  }

  const data = collectFormData();
  console.log('Dados do formulário:', data);

  const result = await sendToWebhook(data);

  if (result.success) {
    showToast('✓ Relatório enviado com sucesso!', 'success');
    // Opcional: limpar formulário após sucesso
    // document.getElementById('relatorioForm').reset();
    // showPage(1);
  } else if (result.savedLocally) {
    showToast('⚠ Sem conexão. Dados salvos localmente para envio posterior.', 'error');
  } else {
    showToast(`✗ Erro ao enviar: ${result.error || 'Tente novamente.'}`, 'error');
  }
});

// =====================================================
// TOAST NOTIFICATION
// =====================================================
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 5000);
}

// =====================================================
// INDICADOR DE PENDENTES
// =====================================================
function criarIndicadorPendentes() {
  if (!document.getElementById('pending-indicator')) {
    const indicator = document.createElement('div');
    indicator.id = 'pending-indicator';
    indicator.innerHTML = `
      <span class="pending-icon">⏳</span>
      <span class="pending-count">0</span>
      <span class="pending-text">pendente(s)</span>
      <button type="button" onclick="reenviarPendentes()" class="btn-resend">
        Reenviar
      </button>
    `;
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
      color: white;
      padding: 12px 20px;
      border-radius: 12px;
      display: none;
      align-items: center;
      gap: 10px;
      box-shadow: 0 4px 15px rgba(238, 90, 90, 0.4);
      z-index: 1000;
      font-family: inherit;
      animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(indicator);

    // Adiciona estilos do botão
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      #pending-indicator .pending-count {
        background: white;
        color: #ee5a5a;
        padding: 2px 10px;
        border-radius: 20px;
        font-weight: bold;
        font-size: 14px;
      }
      #pending-indicator .btn-resend {
        background: white;
        color: #ee5a5a;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
        transition: all 0.2s;
      }
      #pending-indicator .btn-resend:hover {
        transform: scale(1.05);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      #pending-indicator .btn-resend:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
      }
      #pending-indicator .pending-icon {
        font-size: 18px;
      }
    `;
    document.head.appendChild(style);
  }
  
  atualizarIndicadorPendentes();
}

function atualizarIndicadorPendentes() {
  const indicator = document.getElementById('pending-indicator');
  const count = FormPersistence.getContagemPendentes();
  
  if (indicator) {
    if (count > 0) {
      indicator.style.display = 'flex';
      indicator.querySelector('.pending-count').textContent = count;
    } else {
      indicator.style.display = 'none';
    }
  }
}

async function reenviarPendentes() {
  const btn = document.querySelector('.btn-resend');
  const originalText = btn.innerHTML;
  
  btn.disabled = true;
  btn.innerHTML = '⏳ Enviando...';
  
  const result = await FormPersistence.processarPendentes();
  
  btn.disabled = false;
  btn.innerHTML = originalText;
  
  atualizarIndicadorPendentes();
  
  if (result.enviados > 0) {
    showToast(`✓ ${result.enviados} registro(s) enviado(s) com sucesso!`, 'success');
  }
  if (result.falhas > 0) {
    showToast(`✗ ${result.falhas} registro(s) ainda pendente(s).`, 'error');
  }
}

// =====================================================
// EVENTOS DE CONEXÃO
// =====================================================
window.addEventListener('online', async () => {
  console.log('[Conexão] Restabelecida');
  showToast('🌐 Conexão restabelecida!', 'success');
  
  await FormPersistence.sleep(2000);
  
  if (FormPersistence.temPendentes()) {
    showToast('⏳ Enviando dados pendentes...', 'success');
    const result = await FormPersistence.processarPendentes();
    atualizarIndicadorPendentes();
    
    if (result.enviados > 0) {
      showToast(`✓ ${result.enviados} pendente(s) enviado(s)!`, 'success');
    }
  }
});

window.addEventListener('offline', () => {
  console.log('[Conexão] Perdida');
  showToast('⚠ Sem conexão. Dados serão salvos localmente.', 'error');
});

// =====================================================
// AUTOMAÇÃO: STATUS DA SEÇÃO - BYPASS (MANUTENÇÃO)
// =====================================================
document.addEventListener("DOMContentLoaded", function() {
  // Elementos para automação
  const statusRadios = document.querySelectorAll('input[name="status_secao_espirais"]');

  const camposAutoPreench = [
    'pressao_trabalho_espirais',
    'densidade_alim_espirais',
    'densidade_overflow_espirais',
    'densidade_underflow_espirais',
    'pistas_rougher',
    'ton_pista_rougher',
    'pistas_cleaner',
    'ton_pista_cleaner'
  ];

  const camposNumericos = [
    { name: 'ciclones_primaria', inputs: document.querySelectorAll('input[name="ciclones_primaria"]') },
    { name: 'bancos_rougher', inputs: document.querySelectorAll('input[name="bancos_rougher"]') }
  ];

  statusRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.value === 'Bypass (Manutenção)') {
        // Preencher campos de pressão e densidade com "bypass"
        camposAutoPreench.forEach(fieldId => {
          const field = document.getElementById(fieldId);
          if (field) {
            field.value = 'bypass';
            field.disabled = true;
          }
        });

        // Remover required dos campos numéricos
        camposNumericos.forEach(grupo => {
          grupo.inputs.forEach(input => {
            input.required = false;
          });
        });

        console.log('[Bypass] Campos preenchidos e campos numéricos tornados opcionais');

      } else if (this.value === 'Operacional') {
        // Limpar campos de pressão e densidade
        camposAutoPreench.forEach(fieldId => {
          const field = document.getElementById(fieldId);
          if (field) {
            field.value = '';
            field.disabled = false;
          }
        });

        // Adicionar required aos campos numéricos
        camposNumericos.forEach(grupo => {
          grupo.inputs.forEach(input => {
            input.required = true;
          });
        });

        console.log('[Operacional] Campos limpos e campos numéricos tornados obrigatórios');
      }
    });
  });
});

// =====================================================
// ATALHOS DE TECLADO
// =====================================================
document.addEventListener("keydown", function (e) {
  if (e.ctrlKey && e.key === "ArrowRight") {
    e.preventDefault();
    nextPage();
  }

  if (e.ctrlKey && e.key === "ArrowLeft") {
    e.preventDefault();
    prevPage();
  }

  if (e.ctrlKey && e.key === "Enter" && currentPage === totalPages) {
    e.preventDefault();
    document.getElementById("relatorioForm").dispatchEvent(new Event("submit"));
  }
});