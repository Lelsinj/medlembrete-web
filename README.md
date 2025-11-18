# 💊 MedLembrete

> Um sistema web progressivo (PWA) para gerenciamento e lembrete de medicamentos, desenvolvido com React e o ecossistema Firebase.

![Badge em Desenvolvimento](https://img.shields.io/badge/Status-Concluído-green)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

## 📋 Sobre o Projeto

O **MedLembrete** é uma aplicação web projetada para ajudar usuários a não esquecerem seus tratamentos médicos. O sistema permite cadastrar medicamentos, horários e dosagens, e utiliza **Cloud Functions** agendadas para enviar **Notificações Push** precisas para o dispositivo do usuário (PC ou Celular) no momento exato do remédio.

Por ser um **PWA (Progressive Web App)**, ele pode ser instalado no celular e funciona como um aplicativo nativo.

## 🚀 Funcionalidades

* 🔐 **Autenticação Segura:** Login e Cadastro via Firebase Auth.
* 💊 **Gestão de Medicamentos:** Adicionar e remover medicamentos com horário e dosagem.
* ☁️ **Dados em Tempo Real:** Sincronização automática via Cloud Firestore.
* 🔔 **Notificações Inteligentes:** Um sistema de backend (Serverless) verifica a cada minuto se há medicamentos agendados e envia alertas.
* 📱 **PWA:** Instalável em dispositivos Android e iOS.

## 🛠️ Tecnologias Utilizadas

**Frontend:**
* React.js + Vite
* TypeScript
* Material UI (MUI)
* Vite PWA Plugin

**Backend & Infraestrutura (Firebase):**
* **Authentication:** Gestão de usuários.
* **Cloud Firestore:** Banco de dados NoSQL.
* **Cloud Functions (V2):** Lógica de agendamento (Schedule) rodando em `southamerica-east1`.
* **Cloud Messaging (FCM):** Envio de notificações push.
* **Hosting:** Hospedagem da aplicação.

## ⚙️ Pré-requisitos

Antes de começar, você precisa ter instalado em sua máquina:
* [Node.js](https://nodejs.org/en/) (v18 ou superior)
* [Firebase CLI](https://firebase.google.com/docs/cli) (`npm install -g firebase-tools`)

## 🔧 Configuração e Instalação
### 1. Clone o repositório
```git clone [https://github.com/Lelsinj/medlembrete-web.git](https://github.com/Lelsinj/medlembrete-web.git)```
```cd medlembrete-web```

2. Instale as dependências
Instale tanto as dependências do frontend quanto do backend (functions).
# Na raiz do projeto
```npm install```

# Na pasta functions
```cd functions```
```npm install```
```cd ..```

3. Configuração do Firebase
Crie um projeto no Console do Firebase.

Ative os serviços: Authentication, Firestore e Cloud Messaging.

Crie um arquivo .env na raiz do projeto seguindo o modelo abaixo:

```VITE_FIREBASE_API_KEY="sua-api-key"```
```VITE_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"```
```VITE_FIREBASE_PROJECT_ID="seu-project-id"```
```VITE_FIREBASE_STORAGE_BUCKET="seu-projeto.appspot.com"```
```VITE_FIREBASE_MESSAGING_SENDER_ID="seu-sender-id"```
```VITE_FIREBASE_APP_ID="seu-app-id"```
```VITE_FIREBASE_VAPID_KEY="sua-chave-publica-vapid-do-cloud-messaging"```

4. Configuração Crítica do Service Worker
O arquivo ```src/firebase-messaging-sw.ts``` utiliza o ```messagingSenderId``` para autenticação. Certifique-se de que ele está lendo corretamente do ```.env``` ou configurado com o ID padrão do manifesto se necessário.

🏃‍♂️ Executando Localmente
Para rodar o projeto em modo de desenvolvimento:
Bash

```npm run dev```
Acesse ```http://localhost:5173```.

Nota: Para testar o Service Worker e as notificações localmente, é recomendado fazer o build e usar o preview:

```npm run build```
```npm run preview```

☁️ Deploy (Publicação)
Backend (Functions)
Para as notificações funcionarem, você precisa publicar a função no Firebase (Requer plano Blaze - Pay as you go).

```firebase deploy --only functions```
Atenção às Permissões do Google Cloud (IAM): Certifique-se de que a conta de serviço da função ([numero]-compute@...) tem as permissões:

```Cloud Datastore User``` (para ler o banco)

A conta de serviço do Pub/Sub deve ter ```Cloud Run Invoker```.

Frontend (Site)
Para colocar o site no ar:

```npm run build```
```firebase deploy --only hosting```

📱 Como usar no Celular
Acesse a URL fornecida pelo Firebase Hosting no navegador do celular (Chrome no Android, Safari no iOS).

Faça Login.

Aceite a permissão de notificações.

(Opcional) Selecione "Adicionar à Tela de Início" para instalar como App.

🤝 Contribuindo
Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.
