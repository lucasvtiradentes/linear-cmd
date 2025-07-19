# Testing Guide

Este projeto usa uma estrutura modular de testes com 3 tipos diferentes.

## 🏗️ Estrutura de Testes

```
tests/
├── unit/                     # Testes unitários (rápidos, isolados)
│   ├── vitest.config.ts     # Config específica para unit tests
│   └── lib/
├── integration/             # Testes de integração (mocks avançados)
│   ├── vitest.config.ts     # Config específica para integration
│   ├── setup.ts             # Setup com mocks avançados
│   └── commands/
└── e2e/                     # Testes E2E (API real)
    ├── vitest.config.ts     # Config específica para E2E
    ├── setup.ts             # Setup para API real
    └── full-workflow.e2e.test.ts
```

## 🚀 Comandos de Teste

### Executar todos os tipos
```bash
npm run test:all           # Roda unit + integration + e2e
npm run test:coverage      # Roda com coverage
```

### Testes unitários (mais rápidos)
```bash
npm run test:unit          # Roda uma vez
npm run test:unit:watch    # Watch mode
```

### Testes de integração (CLI completo, mas mocked)
```bash
npm run test:integration          # Roda uma vez
npm run test:integration:watch    # Watch mode
```

### Testes E2E (API real - mais lentos)
```bash
npm run test:e2e          # Roda uma vez
npm run test:e2e:watch    # Watch mode
```

## ⚙️ Configuração E2E

### 1. Criar arquivo de configuração
```bash
cp .env.e2e.example .env.e2e
```

### 2. Configurar variáveis de ambiente
```bash
# .env.e2e
LINEAR_API_KEY_E2E=lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LINEAR_TEST_ISSUE_ID=WAY-123  # Issue real do seu workspace
LINEAR_TEST_WORKSPACE=your-workspace-name
```

### 3. Obter API Key
1. Acesse Linear Settings > Account > API
2. Crie uma nova API key
3. Cole no arquivo `.env.e2e`

### 4. Escolher Issue de Teste
1. Escolha um issue real do seu workspace
2. Use o formato: `ABC-123`
3. Configure no `.env.e2e`

## 🎯 Tipos de Teste

### Unit Tests
- ✅ **Rápidos** (~10-50ms cada)
- ✅ **Isolados** (mock completo)
- ✅ **Confiáveis** (sem rede)
- 🎯 **Testam**: Lógica de negócio, funções puras

### Integration Tests
- ✅ **Médios** (~200-1000ms cada)
- ✅ **CLI completo** (spawn real do comando)
- ✅ **Mocks avançados** (não chama API real)
- 🎯 **Testam**: Fluxo completo CLI → Client → Config

### E2E Tests
- ⚠️ **Lentos** (~5-30s cada)
- ⚠️ **Dependem de rede** (API real)
- ⚠️ **Podem falhar** (rate limits, issues deletados)
- 🎯 **Testam**: Cenários reais completos

## 🏃‍♂️ Workflow de Desenvolvimento

### Durante desenvolvimento (rápido)
```bash
npm run test:unit:watch    # Feedback imediato
```

### Antes de commit (completo)
```bash
npm run test:unit && npm run test:integration
```

### Antes de release (tudo)
```bash
npm run test:all
```

## 🐛 Debugging

### Ver logs dos testes
```bash
# Unit tests (sem logs por padrão)
npm run test:unit

# Integration tests (mostra saída do CLI)
npm run test:integration

# E2E tests (mostra interação real)
npm run test:e2e
```

### Rodar teste específico
```bash
# Por arquivo
npx vitest run tests/unit/lib/config.test.ts

# Por padrão
npx vitest run --config tests/integration/vitest.config.ts -t "show issue"
```

## 📊 Coverage

```bash
npm run test:coverage
```

Coverage reports são gerados em:
- `coverage/unit/` - Coverage dos unit tests
- `coverage/integration/` - Coverage dos integration tests  
- `coverage/e2e/` - Coverage dos E2E tests

## ✅ **Status da Implementação**

### Implementado e Funcionando:
- ✅ **Unit Tests** - 19 testes passando
- ✅ **Estrutura modular** - Configs separados por tipo
- ✅ **Mocks avançados** - keytar e Linear SDK
- ✅ **Scripts NPM** - Comandos específicos por tipo

### Em Desenvolvimento:
- ⚠️ **Integration Tests** - Estrutura criada, precisa resolver keytar nativo
- ⚠️ **E2E Tests** - Estrutura criada, precisa configuração local

## ❗ Troubleshooting

### E2E tests falhando
1. Verifique se `.env.e2e` existe e está configurado
2. Teste a API key manualmente: `linear issue show WAY-123`
3. Verifique se o issue de teste ainda existe
4. Verifique rate limits da Linear API
5. **Problema conhecido**: keytar requer build nativo

### Integration tests falhando
1. **Problema atual**: keytar não funciona em spawn externo
2. **Solução**: Usar imports diretos em vez de spawn CLI
3. Rode `npm run build` antes dos testes
4. Verifique se os mocks estão corretos em `tests/integration/setup.ts`

### Unit tests falhando
1. Verifique imports/exports dos módulos
2. Verifique se os mocks em `tests/vitest-setup.ts` estão corretos

## 🔧 **Próximos Passos**

Para completar a implementação:

1. **Instalar keytar nativo**: `npm run install` ou usar docker
2. **Ajustar integration tests**: Usar imports diretos em vez de CLI spawn
3. **Configurar E2E**: Criar `.env.e2e` com API key real