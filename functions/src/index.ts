// functions/src/index.ts
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2";

// Dizendo ao Firebase para correr em SP
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
  fcmTokens?: string[];
  fcmToken?: string;
}

// --- FUNÇÃO AUXILIAR PARA CALCULAR A MEIA-NOITE DE HOJE ---
const getTodayStartTimestamp = (targetTimezone: string) => {
    // 1. Cria a data atual, mas convertida para a timezone de destino
    const now = new Date();
    const today = new Date(now.toLocaleString("en-US", { timeZone: targetTimezone }));
    
    // 2. Seta as horas para 00:00:00.000 (meia-noite)
    today.setHours(0, 0, 0, 0);
    
    // 3. Retorna como Timestamp do Firestore
    return admin.firestore.Timestamp.fromDate(today);
};

// --- A NOSSA FUNÇÃO AGENDADA (Sintaxe V2) ---
export const enviarLembretesDeMedicamentos = onSchedule({ 
  schedule: "every 1 minutes",
  timeZone: "America/Sao_Paulo",
}, async (event) => { 
  
  // --- 1. CONFIGURAÇÕES INICIAIS ---
  const timezone = "America/Sao_Paulo";
  const todayStartTimestamp = getTodayStartTimestamp(timezone);

  const agora = new Date();
  const spTime = new Date(agora.toLocaleString("en-US", { timeZone: timezone }));
  const hora = spTime.getHours().toString().padStart(2, '0');
  const minuto = spTime.getMinutes().toString().padStart(2, '0');
  const horaAtual = `${hora}:${minuto}`;

  console.log(`[DEBUG] A função acordou. Hora calculada: '${horaAtual}'.`);

  // --- 2. PROCURAR NO BANCO PELO HORÁRIO ATUAL ---
  const query = db.collection("medicamentos").where("time", "==", horaAtual);
  const snapshot = await query.get();

  if (snapshot.empty) {
    console.log(`[DEBUG] Resultado vazio para '${horaAtual}'.`);
    return;
  }

  // --- 3. LOOP PELOS MEDICAMENTOS ENCONTRADOS ---
  for (const doc of snapshot.docs) {
    const medicamento = doc.data() as Medicamento;

    // A. CHECK DE ADESÃO (NOVO!)
    const historyQuery = db.collection('medicamentos').doc(doc.id).collection('historico')
        .where('takenAt', '>=', todayStartTimestamp) // Verifica se foi tomado hoje
        .limit(1);

    const historySnapshot = await historyQuery.get();

    if (!historySnapshot.empty) {
        // Se encontrarmos um registro em 'historico' para hoje, PULAMOS o alarme.
        console.log(`[DEBUG] Alarme pulado para ${medicamento.name}: Já marcado como tomado hoje.`);
        continue; 
    }
    
    // B. BUSCAR TOKEN E ENVIAR
    const userDocRef = db.collection("users").doc(medicamento.userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      console.warn(`[DEBUG] Utilizador ${medicamento.userId} não encontrado.`);
      continue;
    }

    const userData = userDoc.data() as UserData;
    let tokens: string[] = [];

    if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
      tokens = [...userData.fcmTokens];
    }
    if (userData.fcmToken) {
      tokens.push(userData.fcmToken);
    }
    tokens = [...new Set(tokens)];

    if (tokens.length === 0) {
      console.warn(`[DEBUG] Utilizador ${medicamento.userId} não tem nenhum token cadastrado.`);
      continue;
    }

    console.log(`[DEBUG] ✅ Enviando notificação para ${tokens.length} dispositivo(s).`);

    // Enviar para CADA token da lista
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
        await messaging.send(message);
        console.log(`[DEBUG] ✅ Enviado com sucesso para ...${token.slice(-5)}`);
      } catch (error: any) {
        console.error(`[DEBUG] ❌ Falha ao enviar para ...${token.slice(-5)}:`, error.code);
      }
    });

    await Promise.all(messagePromises);
  }

  console.log(`[DEBUG] Processo finalizado.`);
  return;
});