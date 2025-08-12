(async () => {
  const { PublicKey, Connection, Transaction, SystemProgram, TransactionInstruction } = solanaWeb3;

  const PROGRAM_ID = new PublicKey("JED8TspjbbDp9EKXPkJJw5Zsd8eySSWNygYvSGEakNev");
  const NETWORK = "https://crimson-withered-aura.solana-devnet.quiknode.pro/d77410756a6a1e3b01afdb3a3d008812c6bba779/";
  const connection = new Connection(NETWORK, "confirmed");

  const connectBtn = document.getElementById("connectBtn");
  const walletInfo = document.getElementById("walletInfo");
  const gameDiv = document.getElementById("game");
  const moveSelect = document.getElementById("moveSelect");
  const playBtn = document.getElementById("playBtn");
  const resultDiv = document.getElementById("result");
  const scoreDiv = document.getElementById("score");
  const historyListDiv = document.getElementById("historyList");

  const firebaseSection = document.getElementById("firebaseSection");
  const nicknameInput = document.getElementById("nicknameInput");
  const registerFirebaseBtn = document.getElementById("registerFirebaseBtn");
  const firebaseStatus = document.getElementById("firebaseStatus");

  const rankingTable = document.getElementById("rankingTable");
  const rankingBody = document.getElementById("rankingBody");
  const rankingStatus = document.getElementById("rankingStatus");
  const refreshRankingBtn = document.getElementById("refreshRankingBtn");

  const SCORE_SIZE = 8;
  const HISTORY_SIZE = 10;
  const RECORD_SIZE = 3;
  const DATA_SIZE = SCORE_SIZE + 1 + (HISTORY_SIZE * RECORD_SIZE); // 8 + 1 + 30 = 39 bytes

  let provider = null;
  let publicKey = null;

  function getPDA(userPubkey) {
    return PublicKey.findProgramAddress(
      [new TextEncoder().encode("score"), userPubkey.toBuffer()],
      PROGRAM_ID
    );
  }

  function parseScore(data) {
    if (data.length < SCORE_SIZE) return 0;
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const low = view.getUint32(0, true);
    const high = view.getUint32(4, true);
    return high * 2 ** 32 + low;
  }
function parseHistory(data) {
  if (data.length < DATA_SIZE) return [];

  const history_len = data[SCORE_SIZE];
  if (history_len === 0) return [];

  const history = [];
  const movesMap = ["Rock", "Paper", "Scissors"];
  const resultsMap = ["Lost", "Draw", "Won"];

  for(let i=0; i < history_len; i++) {
    const base = SCORE_SIZE + 1 + i * RECORD_SIZE;
    const player_move = data[base];
    const program_move = data[base + 1];
    const result = data[base + 2];

    history.push({
      round: i + 1,
      playerMove: movesMap[player_move] ?? "?",
      programMove: movesMap[program_move] ?? "?",
      result: resultsMap[result] ?? "?"
    });
  }

  return history;
}
  // function parseHistory(data) {
  //   if (data.length < DATA_SIZE) return [];

  //   const history_len = data[SCORE_SIZE];
  //   if (history_len === 0) return [];

  //   const history = [];
  //   const movesMap = ["Pedra", "Papel", "Tesoura"];
  //   const resultsMap = ["Perdeu", "Empate", "Ganhou"];

  //   for(let i=0; i < history_len; i++) {
  //     const base = SCORE_SIZE + 1 + i * RECORD_SIZE;
  //     const player_move = data[base];
  //     const program_move = data[base + 1];
  //     const result = data[base + 2];

  //     history.push(
  //       `Jogada ${i+1}: Você: ${movesMap[player_move] ?? "?"} | Programa: ${movesMap[program_move] ?? "?"} | Resultado: ${resultsMap[result] ?? "?"}`
  //     );
  //   }

  //   return history;
  // }
function renderCharts(history) {
  // Contadores de escolhas
  const choiceCounts = { Rock: 0, Paper: 0, Scissors: 0 };
  // Contadores de vitórias por escolha
  const winCounts = { Rock: 0, Paper: 0, Scissors: 0 };

  history.forEach(({ playerMove, result }) => {
    if (choiceCounts[playerMove] !== undefined) {
      choiceCounts[playerMove]++;
      if (result === "Won") {
        winCounts[playerMove]++;
      }
    }
  });

  // Dados para o gráfico de escolhas
  const choicesData = {
    labels: ["Rock", "Paper", "Scissors"],
    datasets: [{
      label: "Number of Times Chosen",
      data: [choiceCounts.Rock, choiceCounts.Paper, choiceCounts.Scissors],
      backgroundColor: ["#3498db", "#2ecc71", "#e74c3c"],
    }]
  };

  // Dados para o gráfico de vitórias
  const winsData = {
    labels: ["Rock", "Paper", "Scissors"],
    datasets: [{
      label: "Number of Wins",
      data: [winCounts.Rock, winCounts.Paper, winCounts.Scissors],
      backgroundColor: ["#2980b9", "#27ae60", "#c0392b"],
    }]
  };

  // Configurações do gráfico com cores #00fff2 para linhas, ticks e legendas
  const options = {
    responsive: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#00fff2",
          font: {
            family: "'Orbitron', Arial, sans-serif",
            size: 14,
            weight: 'bold'
          }
        }
      },
      title: {
        display: true,
        text: '',
        color: "#00fff2",
        font: {
          family: "'Orbitron', Arial, sans-serif",
          size: 18,
          weight: 'bold'
        }
      }
    },
scales: {
  y: {
    beginAtZero: true,
    ticks: {
      color: "#00fff2",
      stepSize: 1,
      callback: function(value) {
        return Number.isInteger(value) ? value : null;
      },
      font: {
        family: "'Orbitron', Arial, sans-serif",
        size: 12,
        weight: 'bold'
      }
    },
    grid: {
      color: "#00fff2"
    }
  },
  x: {
    ticks: {
      color: "#00fff2",
      font: {
        family: "'Orbitron', Arial, sans-serif",
        size: 12,
        weight: 'bold'
      }
    },
    grid: {
      color: "#00fff2"
    }
  }
}
  };

  // Inicializa os gráficos (removendo os anteriores se existirem)
  if (window.choicesChartInstance) window.choicesChartInstance.destroy();
  if (window.winsChartInstance) window.winsChartInstance.destroy();

  window.choicesChartInstance = new Chart(
    document.getElementById("choicesChart"),
    {
      type: "bar",
      data: choicesData,
      options: {...options, plugins: { ...options.plugins, title: { ...options.plugins.title, text: "Player Choices" }}}
    }
  );

  window.winsChartInstance = new Chart(
    document.getElementById("winsChart"),
    {
      type: "bar",
      data: winsData,
      options: {...options, plugins: { ...options.plugins, title: { ...options.plugins.title, text: "Wins per Choice" }}}
    }
  );
}
  async function updateScore() {
    const [pda] = await getPDA(publicKey);
    try {
      const accountInfo = await connection.getAccountInfo(pda);
      if (!accountInfo) {
        scoreDiv.innerText = "Score: 0 (conta PDA não existe)";
        return 0;
      }
      const score = parseScore(accountInfo.data);
      scoreDiv.innerText = `Score atual: ${score}`;
      return score;
    } catch (e) {
      scoreDiv.innerText = "Erro ao buscar score";
      return 0;
    }
  }

  // async function updateHistory() {
  //   const [pda] = await getPDA(publicKey);
  //   try {
  //     const accountInfo = await connection.getAccountInfo(pda);
  //     if (!accountInfo) {
  //       historyListDiv.innerText = "Sem histórico disponível.";
  //       return;
  //     }
  //     const history = parseHistory(accountInfo.data);
  //     if (history.length === 0) {
  //       historyListDiv.innerText = "Sem histórico disponível.";
  //       return;
  //     }
  //     historyListDiv.innerText = history.join("\n");
  //   } catch (e) {
  //     historyListDiv.innerText = "Erro ao buscar histórico";
  //   }
  // }

  async function updateHistory() {
  const [pda] = await getPDA(publicKey);
  try {
    const accountInfo = await connection.getAccountInfo(pda);
    if (!accountInfo) {
      historyListDiv.innerHTML = "<em>No history available.</em>";
      return;
    }
    const history = parseHistory(accountInfo.data);
    if (history.length === 0) {
      historyListDiv.innerHTML = "<em>No history available.</em>";
      return;
    }

    // Cria tabela HTML para o histórico
    let tableHTML = `
      <table class="history-table">
        <thead>
          <tr>
            <th>Round</th>
            <th>Your Move</th>
            <th>Program Move</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const entry of history) {
      tableHTML += `
        <tr>
          <td>${entry.round}</td>
          <td>${entry.playerMove}</td>
          <td>${entry.programMove}</td>
          <td>${entry.result}</td>
        </tr>
      `;
    }

    tableHTML += "</tbody></table>";

    historyListDiv.innerHTML = tableHTML;
renderCharts(history);
  } catch (e) {
    historyListDiv.innerHTML = "<em>Error fetching history</em>";
  }
}

  function createInstruction(playerPubkey, playerMove) {
    const data = new Uint8Array([playerMove]);

    return (async () => {
      const [pda, bump] = await getPDA(playerPubkey);

      const keys = [
        { pubkey: playerPubkey, isSigner: true, isWritable: true },
        { pubkey: pda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: new PublicKey("SysvarRent111111111111111111111111111111111"), isSigner: false, isWritable: false },
        { pubkey: new PublicKey("SysvarC1ock11111111111111111111111111111111"), isSigner: false, isWritable: false },
      ];

      return new TransactionInstruction({
        keys,
        programId: PROGRAM_ID,
        data,
      });
    })();
  }
document.querySelectorAll(".moveBtn").forEach(btn => {
  btn.addEventListener("click", async () => {
    const playerMove = parseInt(btn.getAttribute("data-move"));
    resultDiv.innerText = "Sending move...";
    btn.disabled = true;

    try {
      const instruction = await createInstruction(publicKey, playerMove);

      const transaction = new Transaction().add(instruction);
      transaction.feePayer = publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      const signedTx = await provider.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, "confirmed");

      await updateScore();
      await updateHistory();

      // Fetch and display transaction log (English version)
      const txDetails = await connection.getTransaction(signature, { commitment: "confirmed" });
      let logHtml = `📄 Transaction Log\n`;
      logHtml += `Signature: ${signature}\n`;
      logHtml += `Slot: ${txDetails.slot}\n`;
      logHtml += `Status: ${txDetails.meta?.err ? "Failed ❌" : "Confirmed ✅"}\n`;
      logHtml += `Fee paid: ${(txDetails.meta?.fee || 0) / 1e9} SOL\n`;
      logHtml += `\n--- Program Logs ---\n${(txDetails.meta?.logMessages || []).join("\n")}\n`;
      logHtml += `\n🔗 Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`;
      document.getElementById("txLog").textContent = logHtml;

      resultDiv.innerText = `Move sent: ${["Rock", "Paper", "Scissors"][playerMove]}`;
    } catch (e) {
      resultDiv.innerText = "Error: " + e.message;
    } finally {
      btn.disabled = false;
    }
  });
});
//   playBtn.onclick = async () => {
//     playBtn.disabled = true;
//     resultDiv.innerText = "Enviando jogada...";
//     const playerMove = parseInt(moveSelect.value);

//     try {
//       const instruction = await createInstruction(publicKey, playerMove);

//       const transaction = new Transaction().add(instruction);
//       transaction.feePayer = publicKey;
//       const { blockhash } = await connection.getLatestBlockhash();
//       transaction.recentBlockhash = blockhash;

//       const signedTx = await provider.signTransaction(transaction);
//       const signature = await connection.sendRawTransaction(signedTx.serialize());
//       // Fetch transaction details
// const txDetails = await connection.getTransaction(signature, { commitment: "confirmed" });

// // Build detailed log
// let logHtml = `📄 Transaction Log\n`;
// logHtml += `Signature: ${signature}\n`;
// logHtml += `Slot: ${txDetails.slot}\n`;
// logHtml += `Status: ${txDetails.meta?.err ? "Failed ❌" : "Confirmed ✅"}\n`;
// logHtml += `Fee paid: ${(txDetails.meta?.fee || 0) / 1e9} SOL\n`;
// logHtml += `\n--- Program Logs ---\n${(txDetails.meta?.logMessages || []).join("\n")}\n`;
// logHtml += `\n🔗 Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`;

// // Show log in the log div
// document.getElementById("txLog").textContent = logHtml;

// // Also show the game move result
// resultDiv.innerText = `Move sent: ${["Rock", "Paper", "Scissors"][playerMove]}`;

//       // Agora que a tx foi confirmada, podemos atualizar score e histórico
//       await updateScore();
//       await updateHistory();

//       resultDiv.innerText = `Jogada enviada: ${["Pedra", "Papel", "Tesoura"][playerMove]}`;
//     } catch (e) {
//       resultDiv.innerText = "Erro: " + e.message;
//     }
//     playBtn.disabled = false;
//   };

  connectBtn.onclick = async () => {
    if ("solana" in window) {
      provider = window.solana;
      if (!provider.isPhantom) {
        alert("Por favor, use a carteira Phantom.");
        return;
      }
      try {
        const resp = await provider.connect();
        publicKey = resp.publicKey;
        walletInfo.innerText = `Wallet: ${publicKey.toString()}`;
        connectBtn.style.background = "green";
        connectBtn.style.color = "wallet";
        gameDiv.style.display = "block";
        firebaseSection.style.display = "block";
        document.getElementById("chartsSection").classList.remove("hidden");
        document.getElementById("txLog").classList.remove("hidden");

        await updateScore();
        await updateHistory();
        await loadRanking();
      } catch (err) {
        alert("Falha na conexão com carteira: " + err.message);
      }
    } else {
      alert("Phantom Wallet não detectada.");
    }
  };

  // --- FUNÇÃO PARA REGISTRAR NO FIREBASE ---
  registerFirebaseBtn.onclick = async () => {
    if (!publicKey) {
      alert("Conecte sua carteira primeiro.");
      return;
    }

    firebaseStatus.style.color = "black";
    firebaseStatus.innerText = "Registrando no Firebase...";

    try {
      const nickname = nicknameInput.value.trim() || null;
      const score = await updateScore(); // pega o score atual on-chain

      const col = window._firestoreFuncs.collection(window._firestore, "players");
      const docRef = window._firestoreFuncs.doc(col, publicKey.toString());

      await window._firestoreFuncs.setDoc(docRef, {
        pubkey: publicKey.toString(),
        nickname,
        score,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      firebaseStatus.style.color = "green";
      firebaseStatus.innerText = "Registrado com sucesso no ranking Firebase!";
      await loadRanking();
    } catch (e) {
      firebaseStatus.style.color = "red";
      firebaseStatus.innerText = "Erro ao registrar no Firebase: " + e.message;
    }
  };

  // --- FUNÇÃO PARA CARREGAR E EXIBIR O RANKING ---
  async function loadRanking() {
    rankingStatus.innerText = "Carregando ranking...";
    rankingTable.style.display = "none";
    rankingBody.innerHTML = "";

    try {
      const col = window._firestoreFuncs.collection(window._firestore, "players");
      const q = window._firestoreFuncs.query(col, window._firestoreFuncs.orderBy("score", "desc"));
      const querySnapshot = await window._firestoreFuncs.getDocs(q);

      if (querySnapshot.empty) {
        rankingStatus.innerText = "Nenhum jogador registrado ainda.";
        return;
      }

      let rank = 1;
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const pubkey = data.pubkey || docSnap.id;
        const nickname = data.nickname || "";
        const score = data.score ?? 0;
        const updatedAt = data.updatedAt ? new Date(data.updatedAt).toLocaleString() : "";

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${rank}</td>
          <td style="font-family: monospace; font-size: 0.85rem; word-break: break-all;">${pubkey}</td>
          <td>${nickname}</td>
          <td>${score}</td>
          <td>${updatedAt}</td>
        `;
        rankingBody.appendChild(tr);
        rank++;
      });

      rankingTable.style.display = "table";
      rankingStatus.innerText = "";
    } catch (e) {
      rankingStatus.innerText = "Erro ao carregar ranking: " + e.message;
    }
  }

  refreshRankingBtn.onclick = loadRanking;

})();

