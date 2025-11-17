import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2";

// Dizendo ao Firebase que estamos rodando em SP
setGlobalOptions({ region: "southamerica-east1" });

// Inicializar o Admin SDK
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

interface Medicamento {
  name: string;
  dosage: string;
  time: string;
  userId: string;
}

interface UserData {
  fcmToken: string;
}

// --- A NOSSA FUNÇÃO AGENDADA ---
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
    // Código de debug de listagem removido para limpar, já sabemos que funciona
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
    const token = userData.fcmToken;

    if (!token) {
      console.warn(`[DEBUG] Utilizador ${medicamento.userId} sem token.`);
      continue;
    }

    // --- MUDANÇA AQUI: USANDO O NOVO FORMATO DE MENSAGEM ---
    const message = {
      token: token,
      notification: {
        title: "Hora do Remédio! 💊",
        body: `É hora de tomar o seu ${medicamento.name} (${medicamento.dosage}).`,
      },
      // Configuração específica para Web
      webpush: {
        notification: {
          icon: '/favicon.ico'
        }
      }
    };

    // --- MUDANÇA AQUI: ENVIANDO DIRETAMENTE COM LOG DE ERRO DETALHADO ---
    try {
      const response = await messaging.send(message);
      console.log(`[DEBUG] ✅ Mensagem enviada com sucesso! ID: ${response}`);
    } catch (error) {
      console.error(`[DEBUG] ❌ Erro CRÍTICO ao enviar para o token ${token.substring(0, 10)}...`);
      console.error(error);
    }
  }

  console.log(`[DEBUG] Processo finalizado.`);
  return;
});