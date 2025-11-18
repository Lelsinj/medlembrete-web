// functions/src/index.ts
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2";

// Dizendo ao Firebase que estamos rodando em SP
setGlobalOptions({ region: "southamerica-east1" });

// Inicializar o Admin SDK
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Definição do tipo para Medicamento
 */
interface Medicamento {
  name: string;
  dosage: string;
  time: string;
  userId: string;
}

/**
 * Definição do tipo para os dados do Utilizador
 * Atualizado para suportar lista de tokens
 */
interface UserData {
  fcmTokens?: string[]; // Novo campo (Lista)
  fcmToken?: string;    // Campo antigo (String) - mantido para compatibilidade
}

// --- A NOSSA FUNÇÃO AGENDADA (Sintaxe V2) ---
export const enviarLembretesDeMedicamentos = onSchedule({ 
  schedule: "every 1 minutes",
  timeZone: "America/Sao_Paulo",
}, async (event) => { 
  
  // --- 1. CALCULAR A HORA ATUAL ---
  const agora = new Date();
  const spTime = new Date(agora.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  
  const hora = spTime.getHours().toString().padStart(2, '0');
  const minuto = spTime.getMinutes().toString().padStart(2, '0');
  const horaAtual = `${hora}:${minuto}`;

  console.log(`[DEBUG] A função acordou. Hora calculada: '${horaAtual}'`);

  // --- 2. PROCURAR NO BANCO ---
  const query = db.collection("medicamentos").where("time", "==", horaAtual);
  const snapshot = await query.get();

  if (snapshot.empty) {
    console.log(`[DEBUG] Resultado vazio para '${horaAtual}'.`);
    return;
  }

  // --- LOOP PELOS MEDICAMENTOS ENCONTRADOS ---
  for (const doc of snapshot.docs) {
    const medicamento = doc.data() as Medicamento;

    // Encontrar o token do utilizador
    const userDocRef = db.collection("users").doc(medicamento.userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      console.warn(`[DEBUG] Utilizador ${medicamento.userId} não encontrado.`);
      continue;
    }

    const userData = userDoc.data() as UserData;
    
    // --- LÓGICA DE MÚLTIPLOS DISPOSITIVOS ---
    // 1. Criar uma lista unificada de tokens
    let tokens: string[] = [];

    // Adiciona os tokens da nova lista (se existirem)
    if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
      tokens = [...userData.fcmTokens];
    }

    // Adiciona o token antigo (se existir) para não quebrar versões velhas
    if (userData.fcmToken) {
      tokens.push(userData.fcmToken);
    }

    // Remove duplicatas (para não enviar 2x para o mesmo celular)
    tokens = [...new Set(tokens)];

    if (tokens.length === 0) {
      console.warn(`[DEBUG] Utilizador ${medicamento.userId} não tem nenhum token cadastrado.`);
      continue;
    }

    console.log(`[DEBUG] Enviando para ${tokens.length} dispositivo(s) do usuário.`);

    // --- ENVIAR PARA CADA TOKEN DA LISTA ---
    const messagePromises = tokens.map(async (token) => {
      const message = {
        token: token,
        notification: {
          title: "Hora do Remédio! 💊",
          body: `É hora de tomar o seu ${medicamento.name} (${medicamento.dosage}).`,
        },
        webpush: {
          notification: { icon: '/favicon.ico' }
        }
      };

      try {
        const response = await messaging.send(message);
        console.log(`[DEBUG] ✅ Enviado! ID: ${response} | Token final ...${token.slice(-5)}`);
      } catch (error: any) {
        // Se o token for inválido (ex: app desinstalado), logamos o erro.
        // Futuramente podemos adicionar lógica aqui para remover tokens mortos do banco.
        console.error(`[DEBUG] ❌ Falha ao enviar para ...${token.slice(-5)}:`, error.code);
      }
    });

    // Esperar todos os envios deste usuário antes de passar para o próximo
    await Promise.all(messagePromises);
  }

  console.log(`[DEBUG] Processo finalizado.`);
  return;
});