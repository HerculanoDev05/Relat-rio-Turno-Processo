// Estado atual do formulário
      let currentPage = 1;
      const totalPages = 8;

      // Inicializar formulário
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
      });

      // Mostrar página específica
      function showPage(pageNumber) {
        // Esconder todas as páginas
        document.querySelectorAll(".form-page").forEach((page) => {
          page.classList.remove("active");
        });

        // Mostrar página atual
        const page = document.getElementById(`page${pageNumber}`);
        if (page) {
          page.classList.add("active");
          currentPage = pageNumber;

          // Scroll para o topo
          window.scrollTo(0, 0);
        }
      }

      // Avançar para próxima página
      function nextPage() {
        const currentPageElement = document.getElementById(
          `page${currentPage}`,
        );

        // Validar campos obrigatórios da página atual
        if (!validateCurrentPage(currentPageElement)) {
          showToast(
            "Por favor, preencha todos os campos obrigatórios antes de avançar.",
            "error"
          );
          return;
        }

        if (currentPage < totalPages) {
          showPage(currentPage + 1);
        }
      }

      // Voltar para página anterior
      function prevPage() {
        if (currentPage > 1) {
          showPage(currentPage - 1);
        }
      }

      // Validar página atual
      function validateCurrentPage(pageElement) {
        // Validar campos de texto obrigatórios
        const requiredTextInputs = pageElement.querySelectorAll(
          'input[required][type="text"], input[required][type="date"], input[required][type="number"]',
        );
        for (let input of requiredTextInputs) {
          if (!input.value.trim()) {
            input.focus();
            return false;
          }
        }

        // Validar radio buttons obrigatórios
        const requiredRadioGroups = new Set();
        pageElement
          .querySelectorAll('input[required][type="radio"]')
          .forEach((radio) => {
            requiredRadioGroups.add(radio.name);
          });

        for (let groupName of requiredRadioGroups) {
          const checked = pageElement.querySelector(
            `input[name="${groupName}"]:checked`,
          );
          if (!checked) {
            // Focar no primeiro radio do grupo
            const firstRadio = pageElement.querySelector(
              `input[name="${groupName}"]`,
            );
            if (firstRadio) {
              firstRadio.focus();
            }
            return false;
          }
        }

        return true;
      }

      // Configurar campos "Outro"
      function setupOtherFields() {
        document.querySelectorAll(".radio-option").forEach((option) => {
          const radioInput = option.querySelector('input[type="radio"]');
          const otherInput = option.querySelector(".other-input");

          if (radioInput && otherInput) {
            // Habilitar/desabilitar campo de texto conforme seleção
            radioInput.addEventListener("change", function () {
              if (this.checked) {
                otherInput.disabled = false;
                otherInput.focus();
              }
            });

            // Marcar radio quando digitar no campo de texto
            otherInput.addEventListener("focus", function () {
              radioInput.checked = true;
            });

            // Desabilitar outros campos "Outro" do mesmo grupo
            radioInput.addEventListener("change", function () {
              if (this.checked) {
                // Desabilitar outros campos "Outro" do mesmo grupo
                const groupName = this.name;
                document
                  .querySelectorAll(`input[name="${groupName}"]`)
                  .forEach((radio) => {
                    const parentOption = radio.closest(".radio-option");
                    const otherField =
                      parentOption?.querySelector(".other-input");
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

      // Atalhos de teclado
      document.addEventListener("keydown", function (e) {
        // Ctrl + Seta Direita = Próxima página
        if (e.ctrlKey && e.key === "ArrowRight") {
          e.preventDefault();
          nextPage();
        }

        // Ctrl + Seta Esquerda = Página anterior
        if (e.ctrlKey && e.key === "ArrowLeft") {
          e.preventDefault();
          prevPage();
        }

        // Ctrl + Enter = Enviar (se na última página)
        if (e.ctrlKey && e.key === "Enter" && currentPage === totalPages) {
          e.preventDefault();
          document
            .getElementById("relatorioForm")
            .dispatchEvent(new Event("submit"));
        }
      });

      // =====================================================
      // CÓDIGO DO WEBHOOK
      // =====================================================
      const WEBHOOK_CONFIG = {
        url: 'https://n8n.wellia.cloud/webhook-test/formulario-solicitacao',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      // Mostrar toast notification
      function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
          toast.classList.remove('show');
        }, 5000);
      }

      // Coletar todos os dados do formulário
      function collectFormData() {
        const formData = new FormData(document.getElementById('relatorioForm'));
        const data = {};

        // Coletar todos os campos do FormData
        for (let [key, value] of formData.entries()) {
          // Pular os campos campo_* e agua_* pois serão agrupados depois
          if (!key.startsWith('campo_') && !key.startsWith('agua_')) {
            data[key] = value;
          }
        }

        // Coletar campos "Outro" que foram preenchidos
        document.querySelectorAll('.other-input').forEach(input => {
          const radioParent = input.closest('.radio-option');
          const radio = radioParent?.querySelector('input[type="radio"]');
          if (radio && radio.checked && input.value.trim()) {
            data[radio.name] = input.value.trim();
          }
        });

        // Agrupar campos WHC em objetos separados
        const whcEquipments = ['whc01', 'whc02', 'whc03', 'whc04', 'whc05', 'whc06', 'whc07', 'whc08', 'whc10', 'whc11', 'ghx'];
        data.whc_campo_magnetico = {};
        data.whc_agua_lavagem = {};

        whcEquipments.forEach(equipment => {
          const campoRadio = document.querySelector(`input[name="campo_${equipment}"]:checked`);
          const aguaRadio = document.querySelector(`input[name="agua_${equipment}"]:checked`);
          if (campoRadio) {
            data.whc_campo_magnetico[equipment] = campoRadio.value;
          }
          if (aguaRadio) {
            data.whc_agua_lavagem[equipment] = aguaRadio.value;
          }
        });

        // Adicionar metadados
        data.timestamp_envio = new Date().toISOString();
        data.formulario = 'Relatório de Turno - Processo';

        return data;
      }

      // Enviar dados para o webhook
      async function sendToWebhook(data) {
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;
        
        try {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="spinner"></span> Enviando...';

          const response = await fetch(WEBHOOK_CONFIG.url, {
            method: WEBHOOK_CONFIG.method,
            headers: WEBHOOK_CONFIG.headers,
            body: JSON.stringify(data)
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          let responseData;
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
          } else {
            responseData = await response.text();
          }

          console.log('Resposta do webhook:', responseData);
          return { success: true, data: responseData };

        } catch (error) {
          console.error('Erro ao enviar para webhook:', error);
          return { success: false, error: error.message };
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }

      // Submeter formulário
      document.getElementById('relatorioForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const lastPage = document.getElementById(`page${totalPages}`);
        if (!validateCurrentPage(lastPage)) {
          showToast('Por favor, preencha todos os campos obrigatórios antes de enviar.', 'error');
          return;
        }

        const data = collectFormData();
        console.log('Dados do formulário:', data);

        const result = await sendToWebhook(data);

        if (result.success) {
          showToast('✓ Relatório enviado com sucesso!', 'success');
        } else {
          showToast(`✗ Erro ao enviar: ${result.error}`, 'error');
        }
      });