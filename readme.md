# 📋 Relatório de Turno - Processo

Sistema de formulário web para registro e envio de relatórios de turno do setor de Processo, utilizado para documentar parâmetros operacionais de britagem, peneiramento, WDRE, espirais, WHC, ciclonagem, espessamento e filtragem.

## 📸 Preview

O formulário possui um design moderno com gradientes em roxo/rosa, navegação por páginas e validação em tempo real.

## ✨ Funcionalidades

- **Formulário Multi-página**: 8 páginas organizadas por setor/área
- **Validação em Tempo Real**: Campos obrigatórios validados antes de avançar
- **Campos Dinâmicos**: Opção "Outro" com input de texto habilitado automaticamente
- **Matrizes de Seleção**: Grids para configuração de equipamentos WHC
- **Integração Webhook**: Envio automático dos dados para n8n/API externa
- **Notificações Toast**: Feedback visual de sucesso/erro
- **Atalhos de Teclado**: Navegação rápida pelo formulário
- **Design Responsivo**: Funciona em desktop, tablet e mobile
- **Auto-preenchimento de Data**: Data atual preenchida automaticamente

## 🏗️ Estrutura do Formulário

| Página | Seção | Campos Principais |
|--------|-------|-------------------|
| 1 | Informações Básicas | Data, Turno, Equipe, Técnico de Processo |
| 2 | Britagem e Peneiramento | Alimentação, BT's, Linhas 01/02, Britagem Terciária/Quaternária |
| 3 | WDRE | Densidade, RM's, Ciclonagem, PD's, Amostrador TC-26 |
| 4 | Espirais | Ciclonagem Primária, Rougher, Cleaner, BP-07 |
| 5 | WHC | Rota, Campo Magnético (matriz), Água de Lavagem (matriz) |
| 6 | Ciclonagem/Espessamento | Ciclones, Floculante, Dosagens, Turbidez |
| 7 | Filtragem | Filtros Cerâmica, Disco, Prensa, Amostrador TC-20 |
| 8 | Ocorrências | Campo de texto livre para relato |



1. Clone o repositório:
```bash
git clone https://github.com/SEU_USUARIO/relatorio-turno-processo.git
cd relatorio-turno-processo
```


```javascript
const WEBHOOK_CONFIG = {
  url: 'https://sua-url-webhook.com/endpoint',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};
```



## 📦 Estrutura de Dados Enviados

O formulário envia um JSON estruturado com todos os campos:

```json
    {
        "data": "2026-03-24",
  "turno": "07x19",
  "equipe": "C",
  "tecnico": "Ernane Silva",
  
  "// Britagem e Peneiramento": "",
  "alimentacao_blending": "valor",
  "bt301": "valor",
  "linha01": "Disponível",
  "linha1_alimentacao": "Pilha Britagem Primária",
  "bt101": "valor",
  "bt102": "valor",
  "linha02": "Disponível",
  "linha02_alimentacao": "Pilha 301",
  "bt201": "valor",
  "britagem_terciaria": "Operando",
  "bt104_107": "valor",
  "britagem_quaternaria": "Operando",
  
  "// WDRE": "",
  "densidade_alimentacao": "valor",
  "num_rm": "valor",
  "taxa_alimentacao": "valor",
  "ciclones_wdre": "1",
  "pressao_trabalho_wdre": "valor",
  "densidade_alim_ciclonagem": "valor",
  "densidade_overflow": "valor",
  "densidade_underflow": "valor",
  "fluxo_overflow": "CX-101",
  "pds_operacao": "PD-12",
  "amostrador_tc26": "Operando",
  
  "// Espirais": "",
  "ciclones_primaria": "1",
  "pressao_trabalho_espirais": "valor",
  "densidade_alim_espirais": "valor",
  "densidade_overflow_espirais": "valor",
  "densidade_underflow_espirais": "valor",
  "bancos_rougher": "6",
  "pistas_rougher": "valor",
  "ton_pista_rougher": "valor",
  "pistas_cleaner": "valor",
  "ton_pista_cleaner": "valor",
  "ciclones_bp07": "2",
  "pressao_bp07": "valor",
  "pds_concentrado": "PD-05",
  "fluxo_pd06": "CX-11",
  "pds_rejeito": "PD-06",
  "amostrador_tc14": "Operando",
  
  "// WHC": "",
  "whc_rota": "Rota 2 (nova)",
  "campo_whc01": "Alto",
  "campo_whc02": "Alto",
  "campo_whc08": "Alto",
  "campo_whc10": "Alto",
  "campo_whc11": "Alto",
  "campo_whc03": "Alto",
  "campo_whc04": "Alto",
  "campo_whc05": "Alto",
  "campo_whc06": "Alto",
  "campo_whc07": "Alto",
  "campo_ghx": "Alto",
  "agua_whc01": "4",
  "agua_whc02": "4",
  "agua_whc08": "4",
  "agua_whc10": "4",
  "agua_whc11": "4",
  "agua_whc03": "4",
  "agua_whc04": "4",
  "agua_whc05": "4",
  "agua_whc06": "4",
  "agua_whc07": "4",
  "agua_ghx": "4",
  "teste_peneirinha": "Realizado - Identificado contaminação",
  "densidade_whc_rougher": "valor",
  "densidade_whc_scavenger": "valor",
  "densidade_whc_cleaner": "valor",
  
  "// Objetos agrupados WHC (redundante, para facilitar processamento)": "",
  "whc_campo_magnetico": {
    "whc01": "Alto",
    "whc02": "Alto",
    "whc08": "Alto",
    "whc10": "Alto",
    "whc11": "Alto",
    "whc03": "Alto",
    "whc04": "Alto",
    "whc05": "Alto",
    "whc06": "Alto",
    "whc07": "Alto",
    "ghx": "Alto"
  },
  "whc_agua_lavagem": {
    "whc01": "4",
    "whc02": "4",
    "whc08": "4",
    "whc10": "4",
    "whc11": "4",
    "whc03": "4",
    "whc04": "4",
    "whc05": "4",
    "whc06": "4",
    "whc07": "4",
    "ghx": "4"
  },
  
  "// Ciclonagem / Espessamento / Floculante": "",
  "ciclones_rejeitos": "2",
  "pressao_ciclonagem": "valor",
  "densidade_alimentacao_rejeitos": "valor",
  "densidade_underflow_rejeitos": "valor",
  "densidade_overflow_rejeitos": "valor",
  "floculante_utilizado": "SNF AN 840 XV",
  "dosagem_rejeito": "valor",
  "dosagem_concentrado": "valor",
  "dosagem_medio": "valor",
  "dosagem_novo": "valor",
  "turbidez": "Não",
  
  "// Filtragem": "",
  "filtros_ceramica": "2",
  "filtro_disco": "2",
  "densidade_alimentacao_rejeito": "valor",
  "filtro_concentrado": "3",
  "densidade_alimentacao_filtragem_concentrado": "valor",
  "amostrador_tc20": "Operando",
  "filtros_prensa": "2",
  "densidade_filtro_prensa": "valor",
  
  "// Ocorrências": "",
  "ocorrencias": "Texto livre com relato das ocorrências do turno",
  
  "// Metadados": "",
  "timestamp_envio": "2026-03-24T13:50:30.688Z"
    }
```

## 🛠️ Tecnologias Utilizadas

- **HTML5** - Estrutura do formulário
- **CSS3** - Estilização com gradientes e responsividade
- **JavaScript (Vanilla)** - Lógica de navegação, validação e envio
- **Fetch API** - Comunicação com webhook
- **LocalStorage** - Salvamento de progresso (opcional)

## 📁 Estrutura de Arquivos

```
relatorio-turno-processo/
├── index.html          # Arquivo principal com HTML, CSS e JS
├── styles-completo.css # Estilos externos (opcional)
├── script-completo.js  # Scripts externos (opcional)
└── README.md           # Este arquivo
```




## 🔧 Integração com n8n

O formulário foi projetado para integrar com workflows n8n:

1. Crie um webhook node no n8n
2. Configure como `POST` e copie a URL gerada
3. Atualize a `WEBHOOK_CONFIG.url` no código
4. Os dados chegam como JSON no body da requisição


---

**Versão:** 1.0.0  
**Última atualização:** Março/2026