# 🤖 AI Developer Guide & Context

Este documento serve como a **"memória central"** e guia de regras para Agentes de IA que farão manutenção ou adicionarão novas funcionalidades ao **Projeto 67 Dias**.

---

## 1. Arquitetura e Roteamento

*   **Roteamento Baseado em Estado**: O projeto **NÃO** usa `react-router-dom`. A navegação é controlada pela variável de estado `activeView` no `App.tsx` e pelo Enum `ViewState` em `types.ts`.
*   **Lazy Loading (Obrigatório)**: Todos os módulos (\"Views\") dentro de `components/views/` DEVEM ser importados usando `React.lazy` no `App.tsx` para manter a performance.
*   **Micro-Frontend Simulado**: Cada view deve ser autossuficiente. Evite acoplamento forte entre views diferentes.

---

## 2. Regras de Estilização (Tailwind CSS)

*   **Tema Dark**: O padrão é sempre dark mode.
    *   Background App: `bg-slate-950`
    *   Container/Cards: `bg-slate-800` ou `bg-slate-800/50` (com backdrop-blur).
    *   Bordas: `border-slate-700` ou `border-slate-700/50`.
    *   Texto Principal: `text-slate-200`.
    *   Texto Secundário: `text-slate-400`.
*   **Animações**: Use `animate-in fade-in zoom-in-95 duration-500` ao montar novos componentes para suavidade.
*   **Ícones**: Use `lucide-react`. Sempre defina o `size` e, se necessário, a cor via classes do Tailwind (`text-cyan-500`).
*   **Tailwind CDN em Produção**: O projeto usa Tailwind via CDN apenas em desenvolvimento. **Nunca** confie no CDN em produção - todas as classes devem ser processadas pelo Vite build.

---

## 3. Passo-a-Passo para Criar Nova Funcionalidade

Para adicionar uma nova view ou funcionalidade:

1.  **Criar Componente**: Crie o arquivo `components/views/NomeView.tsx`.
2.  **Definir Lógica**: Implemente a lógica localmente no arquivo.
3.  **Atualizar Types**: Verifique se `ViewState.NOME` existe em `types.ts`.
4.  **Atualizar App.tsx**:
    *   Adicione o import lazy: `const NomeView = React.lazy(() => import('./components/views/NomeView'));`
    *   Adicione o case no switch `renderContent`: `case ViewState.NOME: return <NomeView />;`

---

## 4. Padrões de Código

*   **Componentes Funcionais**: Sempre use `React.FC` ou funções arrow.
*   **Tipagem**: Evite `any`. Use interfaces em `types.ts` se o tipo for compartilhado, ou localmente se for exclusivo da view.
*   **Memoization**: Use `React.memo` em componentes de lista ou cartões que recebem props simples para evitar re-renders desnecessários.
*   **Hooks**: Sempre declare hooks no topo do componente, antes de qualquer lógica condicional.

---

## 5. Estado Atual do Projeto

### Módulos Implementados (Ativos):
*   ✅ **Dashboard**: Grid principal de navegação.
*   ✅ **Trabalho (`WorkView`)**: Gerenciador de tarefas focado com persistência Firebase.
*   ✅ **Descanso (`RestView`)**: Timer Pomodoro e exercício de respiração visual com IA Gemini.
*   ✅ **Ferramentas (`ToolsView`)**: Calculadora e conversores de unidades.
*   ✅ **Leitura (`ReadingView`)**: Gerenciador de livros com progresso visual e Firebase.
*   ✅ **Progresso (`ProgressView`)**: Gráficos usando Recharts.
*   ✅ **Hábitos (`HabitsView`)**: Sistema de rastreamento de hábitos com Firebase.
*   ✅ **Diário (`JournalView`)**: Diário pessoal com Firebase.
*   ✅ **Skills (`SkillsView`)**: Sistema de rastreamento de habilidades com IA (Gemini) para roadmaps.
*   ✅ **Autenticação (`AuthView`)**: Sistema de login/registro com Firebase Auth.
*   ✅ **Configurações (`SettingsView`)**: Configurações da aplicação.
*   ✅ **Links (`LinksView`)**: Gerenciador de links favoritos.
*   ✅ **Domingo (`SundayView`)**: Planejamento semanal.

### Tecnologias Backend:
*   **Firebase Authentication**: Gerenciamento de usuários.
*   **Firebase Firestore**: Banco de dados NoSQL para persistência.
*   **Gemini API**: IA generativa para roadmaps e sugestões.

---

## 6. Configuração de Variáveis de Ambiente

### ⚠️ **CRÍTICO**: Como Variáveis de Ambiente Funcionam

O projeto usa **Vite** como bundler. Vite tem regras específicas sobre variáveis de ambiente:

1. **Prefixo Obrigatório**: Apenas variáveis prefixadas com `VITE_` são expostas ao código do cliente.
2. **Arquivos de Ambiente**:
   - `.env.local`: Desenvolvimento local (não versionado, ignorado pelo git).
   - **Netlify Environment Variables**: Configuradas no dashboard do Netlify para produção.

3. **Acesso no Código**:
   ```typescript
   // ✅ CORRETO - funciona em dev e prod (com configuração adequada)
   const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
   
   // ❌ ERRADO - process.env não funciona no navegador
   const apiKey = process.env.VITE_GEMINI_API_KEY;
   ```

### 📋 Variáveis Necessárias

Crie um arquivo `.env.local` na raiz com:

```dotenv
# Firebase Configuration
VITE_FIREBASE_API_KEY=sua-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Gemini API
VITE_GEMINI_API_KEY=sua-gemini-api-key
```

### 🔧 Configuração Vite para Produção

O `vite.config.ts` está configurado para:
- Carregar variáveis de ambiente usando `loadEnv()`
- Explicitamente definir todas as variáveis`VITE_*` usando a opção `define`
- Isso garante que as variáveis do **Netlify** sejam incluídas no build de produção

**❌ NÃO remova ou modifique** a seção `define` no `vite.config.ts` sem entender as implicações.

---

## 7. Serviços e Integrações

### Firebase (`services/firebase.ts`)

- **Inicialização**: Singleton pattern - Firebase é inicializado apenas uma vez.
- **Exports**: `auth` (Authentication), `db` (Firestore), `app` (Firebase App).
- **Uso**:
  ```typescript
  import { auth, db } from '@/services/firebase';
  import { collection, addDoc } from 'firebase/firestore';
  
  // Salvar documento
  await addDoc(collection(db, 'tasks'), { text: 'Nova tarefa' });
  ```

### Gemini API (`services/gemini.ts`)

- **Singleton Pattern**: Cliente Gemini é criado uma única vez.
- **Fallback Seguro**: Lança erro claro se a API key não estiver configurada.
- **Uso**:
  ```typescript
  import { getGeminiModel } from '@/services/gemini';
  
  const model = getGeminiModel();
  const response = await model.generateText({ prompt: '...' });
  ```

---

## 8. Testes

### Configuração (Vitest + Testing Library)

- **Framework**: Vitest (compatível com Vite)
- **Testing Library**: React Testing Library
- **Localização**: Testes em `/tests` espelhando a estrutura do projeto

### Executar Testes

```bash
npm test          # Roda todos os testes
npm test -- -u    # Atualiza snapshots
```

### Regras de Testes

1. **Mock de Serviços**: Firebase e Gemini devem ser mockados nos testes.
2. **Exemplo de Mock**:
   ```typescript
   vi.mock('@/services/firebase', () => ({
     auth: {},
     db: {},
   }));
   ```

3. **Environment Variables**: Use `vi.stubEnv()` para simular variáveis nos testes.

---

## 9. Deploy e Produção

### Netlify

- **Comando de Build**: `npm run build`
- **Diretório de Publicação**: `dist`
- **Variáveis de Ambiente**: Configuradas no Netlify Dashboard (todas com prefixo `VITE_`)
- **Redirects**: Configurado em `netlify.toml` para SPA routing

### Processo de Deploy

1. **Commit local**:
   ```bash
   git add .
   git commit -m "feat: nova funcionalidade"
   ```

2. **Push para GitHub**:
   ```bash
   git push origin main
   ```

3. **Deploy Automático**: Netlify detecta o push e faz deploy automaticamente.

### Verificação Pós-Deploy

- Aguarde 1-2 minutos para o build completar
- Verifique o console do navegador em produção para confirmar que não há erros
- Teste funcionalidades que dependem de IA ou Firebase

---

## 10. Armadilhas Comuns e Como Evitar

### ❌ Erro: "Gemini API key is not configured"

**Causa**: Variáveis de ambiente não estão sendo bundladas no build de produção.

**Solução**: Verifique que:
1. Variáveis estão definidas no Netlify com prefixo `VITE_`
2. `vite.config.ts` tem a seção `define` com todas as variáveis
3. Código usa `import.meta.env.VITE_*` e não `process.env.*`

### ❌ Erro: "Firebase: Error (auth/invalid-api-key)"

**Causa**: API key do Firebase está incorreta ou não está sendo carregada.

**Solução**:
1. Verifique `.env.local` localmente
2. Verifique variáveis no Netlify para produção
3. Confirme que não há espaços extras ou caracteres invisíveis nas keys

### ❌ Erro: "Module not found" ao fazer lazy loading

**Causa**: Caminho incorreto no `React.lazy()`.

**Solução**: Use caminhos relativos corretos:
```typescript
// ✅ CORRETO
const WorkView = React.lazy(() => import('./components/views/WorkView'));

// ❌ ERRADO
const WorkView = React.lazy(() => import('components/views/WorkView'));
```

### ❌ Tailwind não funciona em produção

**Causa**: Usando CDN ao invés do build process.

**Solução**: Nunca dependa do CDN em produção. O aviso do console é intencional:
> "cdn.tailwindcss.com should not be used in production"

O build do Vite processa automaticamente as classes Tailwind.

---

## 11. Instruções Especiais para IA

### Ao Criar Novas Features:
1. **Consistência Visual**: Mantenha o padrão de cartões com `rounded-xl`, sombras sutis, e cores do tema Slate.
2. **Performance**: Sempre use lazy loading para novas views.
3. **Tipagem**: Crie tipos em `types.ts` para compartilhar entre componentes.
4. **Firebase**: Para dados persistentes, sempre use Firestore com subcoleção por usuário:
   ```typescript
   collection(db, `users/${currentUser.uid}/tasks`)
   ```

### Ao Modificar Código Existente:
1. **Não remova** o `Suspense` wrapper no `App.tsx`.
2. **Não modifique** a seção `define` em `vite.config.ts` sem adicionar nota explicativa.
3. **Sempre teste** mudanças em serviços compartilhados (Firebase, Gemini) com `npm test`.

### Ao Debugar Problemas:
1. **Verifique primeiro** as variáveis de ambiente (`.env.local` e Netlify).
2. **Console do navegador**: Sempre verifique erros no console.
3. **Network tab**: Verifique se requests para Firebase/Gemini estão sendo bloqueados por CSP ou CORS.

---

## 12. Referências Úteis

- **Vite Environment Variables**: https://vitejs.dev/guide/env-and-mode.html
- **Firebase Documentation**: https://firebase.google.com/docs
- **Gemini API**: https://ai.google.dev/tutorials/get_started_web
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev/icons/

---

**Última Atualização**: 2025-11-22  
**Versão do Documento**: 2.0