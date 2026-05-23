# LRO Demolições - Controle de Ferramentas & Equipamentos 🛠️

Este é um sistema web robusto e inteligente sob medida criado para a **LRO Demolições**, projetado para resolver de forma definitiva o extravio e a perda de ferramentas no canteiro de obras. 

O sistema conta com fluxo de perfis dedicados (Gerência e Colaborador) e **comprovação de devolução obrigatória por registro fotográfico** diretamente do celular.

---

## 🌟 Principais Recursos

- **Multi-Portais (Responsivo & Mobile):**
  - **Portal do Colaborador:** Desenhado para celulares em obras. Login rápido via **PIN de 4 dígitos** (sem necessidade de senhas complexas). Permite visualizar as ferramentas em posse e solicitar devolução com foto de comprovante.
  - **Portal da Gerência:** Controle total de estoque, logs, cadastro de funcionários e um **Painel de Aprovações** onde o gerente avalia a foto tirada pelo trabalhador antes de liberar a máquina de volta à base.
- **Registro Fotográfico Nativo:**
  - Ativação direta da câmera do aparelho pelo navegador (sem aplicativos externos).
  - Algoritmo de **redimensionamento e compressão automática via HTML5 Canvas** para gerar imagens JPEG leves (Base64) ideais para bancos na nuvem ou locais.
- **Arquitetura Dual-Backend Inteligente:**
  - **Modo Nuvem:** Integração nativa em tempo real com o **Firebase Firestore**.
  - **Modo Local:** Fallback automático para o **LocalStorage** do navegador (com seed data automático) para testes rápidos sem infraestrutura.
- **Identidade Visual Premium:**
  - Tema escuro sofisticado com tons de **Cinza Industrial** e detalhes em **Verde Esmeralda**.
  - Efeitos de transparência *glassmorphism* e micro-animações nas interações.
- **Suporte a PWA (Progressive Web App):**
  - Instalável como aplicativo nativo no Android (Chrome) e iOS (Safari), com ícone na tela de início.

---

## 🛠️ Tecnologias Utilizadas

- **Framework:** Next.js 16 (React) com App Router e TypeScript
- **Estilos:** Vanilla CSS (globals.css) customizado com variáveis dinâmicas
- **Ícones:** Lucide React
- **Banco de Dados / Nuvem:** Firebase SDK v10+ (Cloud Firestore)

---

## 🚀 Como Iniciar o Projeto Localmente

### 1. Pré-requisitos
Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

### 2. Instalar Dependências
Na pasta raiz do projeto, execute:
```bash
npm install
```

### 3. Executar o Servidor de Desenvolvimento
```bash
npm run dev
```
Abra o navegador no endereço [http://localhost:3000](http://localhost:3000) para acessar o painel.

---

## ⚙️ Conectando com a Nuvem (Firebase)

Para sincronizar com vários celulares e ter os dados salvos em nuvem de graça:

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Ative o **Firestore Database** em modo de teste.
3. Obtenha as chaves de configuração criando um aplicativo da Web (`</>`) nas configurações do projeto.
4. Crie um arquivo chamado `.env.local` na raiz deste projeto com a estrutura abaixo:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="sua-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="seu-projeto"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="seu-projeto.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="seu-id-de-mensagens"
NEXT_PUBLIC_FIREBASE_APP_ID="seu-id-do-app"
```

5. Reinicie o servidor local (`npm run dev`) e o sistema fará a transição instantaneamente!

---

## 🔒 Segurança de Credenciais

> ⚠️ **Importante:** O arquivo `.env.local` que contém as chaves do Firebase está listado no `.gitignore` por padrão. Ele **nunca** será enviado para o repositório público do GitHub, mantendo o seu banco de dados totalmente seguro!
