import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON middleware to parse incoming request payloads
  app.use(express.json());

  // API Route - STK Push Proxy to bypass CORS completely
  app.post("/api/proxy-stk", async (req, res) => {
    try {
      let { vercelApiUrl, headers, payload } = req.body;
      
      // Prioritize server-configured environment variables for production security
      const envUrl = process.env.MPESA_STK_API_URL;
      const envHeadersStr = process.env.MPESA_STK_API_HEADERS;

      let targetUrl = envUrl ? envUrl.trim() : (vercelApiUrl ? vercelApiUrl.trim() : 'http://127.0.0.1:3000/api/pay');
      let targetHeaders = headers || { "Content-Type": "application/json" };

      if (envHeadersStr) {
        try {
          const parsedEnvHeaders = JSON.parse(envHeadersStr);
          targetHeaders = { ...targetHeaders, ...parsedEnvHeaders };
        } catch (e) {
          console.error("[Proxy Gateway] Failed to parse MPESA_STK_API_HEADERS env string, using default headers.", e);
        }
      }

      if (!targetUrl) {
        return res.status(400).json({ error: "Missing STK endpoint URL configuration." });
      }

      // If relative URL string, attach loopback base address to avoid Node fetch exceptions
      if (targetUrl.startsWith("/")) {
        targetUrl = `http://127.0.0.1:3000${targetUrl}`;
      }

      // Proactively enforce HTTPS protocols to secure transit handshakes (exempting loopback/localhost connections)
      const isLocalHost = targetUrl.includes("localhost") || targetUrl.includes("127.0.0.1") || targetUrl.includes("0.0.0.0");
      if (targetUrl.startsWith("http://") && !isLocalHost) {
        targetUrl = targetUrl.replace("http://", "https://");
      }

      console.log(`[Proxy Gateway] Securely relaying STK request to HTTPS target: ${targetUrl}`);
      
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: targetHeaders,
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let responseData = {};
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { text: responseText };
      }

      console.log(`[Proxy] Target responded with status ${response.status}`);
      res.status(response.status).json(responseData);
    } catch (e: any) {
      console.error("[Proxy Gateway Error]:", e);
      res.status(500).json({ error: e.message || "Failed to establish a secure server-side HTTPS proxy connection." });
    }
  });

  // Local mirror of /api/pay for Vercel parity and local environment testing
  app.post("/api/pay", (req, res) => {
    try {
      const { phone, phoneNumber, amount, reference } = req.body || {};
      const targetPhone = phone || phoneNumber || "";
      const targetAmount = parseFloat(amount || "1000");

      if (!targetPhone) {
        return res.status(400).json({ error: "Missing required parameter: phone/phoneNumber." });
      }
      if (isNaN(targetAmount) || targetAmount <= 0) {
        return res.status(400).json({ error: "Invalid currency parameter: amount must be a positive number." });
      }

      console.log(`[Local API Pay] Processing payment init for ${targetPhone} - KSh ${targetAmount}`);
      const ref = reference || `CH-${Math.floor(100000 + Math.random() * 900000)}`;

      // Return sandbox compliant success format
      res.status(200).json({
        status: "success",
        message: "STK request generated successfully via local gateway.",
        merchantRequestId: `local-req-${Date.now()}`,
        checkoutRequestId: `local-chk-${Math.random().toString(36).substring(3, 11).toUpperCase()}`,
        responseCode: "0",
        customerMessage: "Success. Request accepted for processing.",
        amount: targetAmount,
        phone: targetPhone,
        reference: ref
      });
    } catch (err: any) {
      console.error("[Local API Pay Error]:", err);
      res.status(500).json({ error: err.message || "Internal server error during pay init." });
    }
  });

  // Local mirror of /api/callback webhook receiver
  app.post("/api/callback", (req, res) => {
    try {
      const payload = req.body || {};
      console.log("[Local Webhook Callback] Logging receipt payload:", JSON.stringify(payload, null, 2));
      res.status(200).json({
        status: "acknowledged",
        message: "Local webhook processed successfully."
      });
    } catch (err: any) {
      console.error("[Local Webhook Callback Error]:", err);
      res.status(500).json({ error: err.message || "Internal server error during webhook callback." });
    }
  });

  // Simple status health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV, roundIndex });
  });

  // Create standard HTTP server mapped to Express
  const server = createServer(app);

  // Initialize unified WebSockets server on the same port
  const wss = new WebSocketServer({ server });

  // Compute deterministic round limit based on round index only to be identical on all devices
  function getRoundLimit(roundIdx: number): number {
    let h = Math.abs(Math.sin(roundIdx) * 10000);
    h = h - Math.floor(h);

    // 0.5% chance of a high gold round (200x to 1000x)
    if (h > 0.995) {
      const p = (h - 0.995) / 0.005;
      return parseFloat((100.00 + p * 900.00).toFixed(2));
    }

    // Highly authentic Aviator model: over 55% of rounds crash under 2.00x (1.00 - 1.99)
    if (h < 0.11) {
      // 11% of rounds crash immediately at 1.00x
      return 1.00;
    } else if (h < 0.55) {
      // 44% of rounds crash between 1.01x and 1.99x
      const p = (h - 0.11) / 0.44;
      return parseFloat((1.01 + p * 0.98).toFixed(2));
    } else if (h < 0.80) {
      // 25% of rounds crash between 2.00x and 10.00x
      const p = (h - 0.55) / 0.25;
      return parseFloat((2.00 + p * 8.00).toFixed(2));
    } else if (h < 0.95) {
      // 15% of rounds between 10.01x and 30.00x
      const p = (h - 0.80) / 0.15;
      return parseFloat((10.01 + p * 19.99).toFixed(2));
    } else {
      // Rare hits between 30.01x and 100.00x
      const p = (h - 0.95) / 0.045; // 0.95 to 0.995 is 0.045
      return parseFloat((30.01 + p * 69.99).toFixed(2));
    }
  }

  // Deterministic game state timeline calculations synced to the millisecond of the system clock
  function getGameStateAtTime(now: number) {
    const dayMs = 86400000;
    const startOfDay = now - (now % dayMs);
    
    const dayIndex = Math.floor(startOfDay / dayMs);
    let roundIdx = dayIndex * 10000;
    
    let tempTime = startOfDay;
    const lobbyDur = 6000;
    const crashedDur = 2200;

    let currPhase: 'lobby' | 'flight' | 'crashed' = 'lobby';
    let phaseStart = tempTime;
    let baseLimit = 1.00;
    let baseFlightDuration = 0;

    while (true) {
      baseLimit = getRoundLimit(roundIdx);
      baseFlightDuration = baseLimit <= 1.00 ? 0 : Math.round((Math.log(baseLimit) / 0.0866) * 1000);
      const roundDuration = lobbyDur + baseFlightDuration + crashedDur;

      if (tempTime + roundDuration > now) {
        const elapsedInRound = now - tempTime;
        
        if (elapsedInRound < lobbyDur) {
          currPhase = 'lobby';
          phaseStart = tempTime;
        } else if (elapsedInRound < lobbyDur + baseFlightDuration) {
          currPhase = 'flight';
          phaseStart = tempTime + lobbyDur;
        } else {
          currPhase = 'crashed';
          phaseStart = tempTime + lobbyDur + baseFlightDuration;
        }
        break;
      }

      tempTime += roundDuration;
      roundIdx++;
    }

    return {
      roundIndex: roundIdx,
      currentPhase: currPhase,
      phaseStartTime: phaseStart,
      baseLimit,
      baseFlightDuration,
      roundStartTime: tempTime
    };
  }

  // Game Engine Synchronization State Variables
  let currentPhase: 'lobby' | 'flight' | 'crashed' = 'lobby';
  let phaseStartTime = Date.now();
  let roundIndex = getGameStateAtTime(Date.now()).roundIndex;
  let limit = 1.85;
  let flightDuration = 5000;
  let currentMultiplier = 1.00;
  let historyList: number[] = [2.45, 1.18, 1.08, 12.50, 1.95, 2.80, 1.40, 5.25, 1.03, 1.88, 3.12, 1.02, 1.87, 10.43, 2.15, 1.50, 4.30, 1.12, 8.42, 1.25];
  let activePlayers: any[] = [];
  let siteOnlineCount = 1750;
  let onlinePlayersCount = 1450;
  let startingPlayers = 1450;
  let finalMinPlayers = 80;

  const socketMap = new Map<string, WebSocket>();

  function getFlightDuration(clLimit: number): number {
    if (clLimit <= 1.00) return 0;
    return Math.round((Math.log(clLimit) / 0.0866) * 1000);
  }

  function resetActivePlayersForRound() {
    const rand = Math.random;
    siteOnlineCount = Math.min(2650, Math.max(1200, siteOnlineCount + (Math.floor(rand() * 7) - 3)));
    const maxStart = Math.min(2650, Math.max(1200, Math.floor(siteOnlineCount * (0.84 + rand() * 0.08))));
    const minFinal = Math.floor(rand() * (135 - 63 + 1)) + 63;
    startingPlayers = maxStart;
    finalMinPlayers = minFinal;
    onlinePlayersCount = maxStart;

    const poolList: any[] = [];
    const usedNames = new Set<string>();

    const firstNames = [
      'Kamau', 'Amani', 'Njoroge', 'Otieno', 'Wanjiku', 'Mwangi', 'Kibet', 'Juma', 'Zuri', 'Mutua',
      'Fatuma', 'Amina', 'Kiptoo', 'Ngugi', 'Omondi', 'Kariuki', 'Waweru', 'Abdi', 'Adan', 'Ali',
      'Chebet', 'Jepchirchir', 'Kosgei', 'Lagat', 'Maalim', 'Musa', 'Ochieng', 'Odhiambo', 'Okoth',
      'Wanjala', 'Peter', 'John', 'Grace', 'Mercy', 'David', 'James', 'Sarah', 'Mary', 'Joseph'
    ];
    const lastNames = [
      'KE', '254', 'Bettor', 'Hustler', 'Win', '001', 'Racer', 'Bets', 'Safar', 'Guru', 'Rider',
      'VIP', 'Jet', 'Flyer', 'Fast', 'Ace', 'Star', 'Rich', 'Winner', 'Boss', 'Slinger', 'Pro',
      'Gold', 'King', 'Queen', 'Max', 'Apex', 'Hyper', 'Sonic', 'Zon', 'Play', 'Club', 'Storm'
    ];

    const cohortSize = 65;
    for (let i = 0; i < cohortSize; i++) {
      const idx1 = Math.floor(rand() * firstNames.length);
      const first = firstNames[idx1];
      const idx2 = Math.floor(rand() * lastNames.length);
      const last = lastNames[idx2];
      let candidate = `${first}_${last}`;
      if (usedNames.has(candidate)) {
        candidate = `${candidate}_${Math.floor(rand() * 99)}`;
      }
      usedNames.add(candidate);

      const randomStake = rand() > 0.6 
        ? Math.floor(rand() * 800) + 100 
        : Math.floor(rand() * 11000) + 1000;

      // Realistic cashout threshold distributions
      const willSucceed = limit > 1.05 && (rand() < 0.65);
      let cashoutThreshold = 1.5;
      let willCashOut = true;

      if (willSucceed) {
        const powerFactor = Math.pow(rand(), 1.7);
        cashoutThreshold = parseFloat((1.05 + powerFactor * (limit - 1.05)).toFixed(2));
        willCashOut = true;
      } else {
        cashoutThreshold = parseFloat((limit + rand() * 5).toFixed(2));
        willCashOut = false;
      }

      poolList.push({
        id: `sim_${i}_${Math.floor(rand() * 100000)}`,
        username: candidate,
        betAmount: randomStake,
        cashedOut: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cashoutThreshold,
        willCashOut
      });
    }

    // Preserve any real NEXT ROUND wagers when resetting active wagers list
    const realNextBets = activePlayers.filter(p => !p.id.startsWith('sim_') && p.queuedForNextRound);
    realNextBets.forEach(p => {
      p.queuedForNextRound = false;
      p.cashedOut = false;
      p.multiplier = undefined;
      p.payoutAmount = undefined;
    });

    activePlayers = [...poolList, ...realNextBets];
  }

  function broadcast(msg: any) {
    const payload = JSON.stringify(msg);
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN is 1
        client.send(payload);
      }
    });
  }

  // Pre-initialize
  resetActivePlayersForRound();

  const lobbyDuration = 6000;
  const crashedDuration = 2200;

  // Global Engine Tick interval scheduler
  setInterval(() => {
    const now = Date.now();
    const state = getGameStateAtTime(now);
    const elapsed = now - state.phaseStartTime;
    const currentLimit = state.baseLimit;

    // Detect phase transitions on the server too
    if (state.currentPhase !== currentPhase || state.roundIndex !== roundIndex) {
      currentPhase = state.currentPhase;
      roundIndex = state.roundIndex;
      limit = currentLimit;
      flightDuration = state.baseFlightDuration;
      phaseStartTime = state.phaseStartTime;

      if (currentPhase === 'lobby') {
        resetActivePlayersForRound();
        broadcast({
          type: 'PHASE_CHANGE',
          phase: 'lobby',
          roundIndex,
          activePlayers,
          onlinePlayersCount,
          phaseStartTime
        });
      } else if (currentPhase === 'flight') {
        currentMultiplier = 1.00;
        // Recalculate simulated player auto-cashout targets based on the determined flight limit
        activePlayers.forEach(p => {
          if (p.id.startsWith('sim_')) {
            const rand = Math.random();
            const willSucceed = limit > 1.05 && (rand < 0.65);
            if (willSucceed) {
              const powerFactor = Math.pow(rand, 1.7);
              p.cashoutThreshold = parseFloat((1.05 + powerFactor * (limit - 1.05)).toFixed(2));
              p.willCashOut = true;
            } else {
              p.cashoutThreshold = parseFloat((limit + rand * 5).toFixed(2));
              p.willCashOut = false;
            }
          }
        });

        broadcast({
          type: 'PHASE_CHANGE',
          phase: 'flight',
          limit,
          flightDuration,
          phaseStartTime,
          activePlayers,
          roundIndex
        });
      } else if (currentPhase === 'crashed') {
        if (!historyList.includes(limit)) {
          historyList = [limit, ...historyList].slice(0, 30);
        }

        broadcast({
          type: 'PHASE_CHANGE',
          phase: 'crashed',
          limit,
          historyList
        });
      }
    }

    // Tick-level updates
    if (currentPhase === 'lobby') {
      if (Math.random() < 0.15) {
        onlinePlayersCount = Math.min(
          Math.floor(siteOnlineCount * 0.94),
          Math.max(1200, onlinePlayersCount + (Math.floor(Math.random() * 5) - 2))
        );
      }
      broadcast({
        type: 'LOBBY_TICK',
        countdownValue: parseFloat(((6000 - elapsed) / 1000).toFixed(1)),
        onlinePlayersCount,
        siteOnlineCount
      });
    } else if (currentPhase === 'flight') {
      const tSec = elapsed / 1000;
      let nextScale = Math.exp(0.0866 * tSec);
      if (nextScale > limit) {
        nextScale = limit;
      }
      currentMultiplier = parseFloat(nextScale.toFixed(2));

      // Evaluate automated auto cash-outs for both real & simulated Bettors
      activePlayers.forEach(p => {
        if (!p.cashedOut) {
          const isSim = p.id.startsWith('sim_');
          if (isSim) {
            if (p.willCashOut && currentMultiplier >= p.cashoutThreshold) {
              p.cashedOut = true;
              p.multiplier = p.cashoutThreshold;
              p.payoutAmount = parseFloat((p.betAmount * p.cashoutThreshold).toFixed(1));
            }
          } else {
            if (p.autoCashoutThreshold && currentMultiplier >= p.autoCashoutThreshold) {
              p.cashedOut = true;
              p.multiplier = p.autoCashoutThreshold;
              p.payoutAmount = parseFloat((p.betAmount * p.autoCashoutThreshold).toFixed(2));

              if (p.socketId) {
                const wsTarget = socketMap.get(p.socketId);
                if (wsTarget && wsTarget.readyState === 1) {
                  wsTarget.send(JSON.stringify({
                    type: 'AUTO_CASHOUT_SUCCESS',
                    multiplier: p.autoCashoutThreshold,
                    payoutAmount: p.payoutAmount,
                    panelId: p.panelId
                  }));
                }
              }
            }
          }
        }
      });

      // Compute remaining online count curves
      let remainingFraction = 1.0;
      if (currentMultiplier <= 1.99) {
        const scaleFraction = Math.max(0, Math.min(1, (currentMultiplier - 1.0) / 0.99));
        remainingFraction = 1.0 - (scaleFraction * 0.12) + (Math.sin(currentMultiplier * 12) * 0.003);
      } else {
        const scaleFraction = Math.max(0, Math.min(1, (currentMultiplier - 1.99) / (limit - 1.99 || 1.0)));
        const floorFrac = 0.035;
        remainingFraction = 0.88 - Math.pow(scaleFraction, 1.6) * (0.88 - floorFrac) + (Math.sin(currentMultiplier * 4) * 0.002);
      }
      remainingFraction = Math.max(0.03, Math.min(1.0, remainingFraction));
      onlinePlayersCount = Math.max(
        finalMinPlayers,
        Math.round(startingPlayers * remainingFraction)
      );

      broadcast({
        type: 'MULTIPLIER_TICK',
        multiplier: currentMultiplier,
        elapsed,
        activePlayers,
        onlinePlayersCount
      });
    }
  }, 100);

  // WebSocket lifecycle listener
  wss.on('connection', (ws) => {
    const socketId = `sock_${Math.random().toString(36).substring(2, 11)}`;
    socketMap.set(socketId, ws);

    // Initial Sync Handshake payload
    ws.send(JSON.stringify({
      type: 'INITIAL_STATE',
      currentPhase,
      phaseStartTime,
      serverTime: Date.now(),
      roundIndex,
      limit,
      flightDuration,
      currentMultiplier,
      historyList,
      activePlayers,
      siteOnlineCount,
      onlinePlayersCount,
      socketId
    }));

    ws.on('message', (messageStr) => {
      try {
        const msg = JSON.parse(messageStr.toString());
        if (msg.type === 'PLACE_BET') {
          const { username, amount, panelId, mode, autoCashoutThreshold } = msg;
          
          const isNextRound = currentPhase === 'flight' || currentPhase === 'crashed';
          const newBet = {
            id: `real_${socketId}_${panelId}_${Date.now()}`,
            username: username || 'Player',
            betAmount: amount,
            cashedOut: false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            mode: mode || 'demo',
            socketId,
            panelId,
            autoCashoutThreshold: autoCashoutThreshold ? parseFloat(autoCashoutThreshold) : null,
            queuedForNextRound: isNextRound
          };

          // Filter out stale bets in the same target round slot (current round vs next round queued)
          activePlayers = activePlayers.filter(p => !(p.socketId === socketId && p.panelId === panelId && p.queuedForNextRound === isNextRound));
          activePlayers.push(newBet);

          broadcast({
            type: 'LOBBY_BET_UPDATE',
            activePlayers
          });
        } else if (msg.type === 'CANCEL_BET') {
          const { panelId, isNextRound } = msg;
          activePlayers = activePlayers.filter(p => !(
            p.socketId === socketId && 
            p.panelId === panelId && 
            !p.cashedOut && 
            (isNextRound !== undefined ? (p.queuedForNextRound === isNextRound) : true)
          ));
          broadcast({
            type: 'LOBBY_BET_UPDATE',
            activePlayers
          });
        } else if (msg.type === 'CASH_OUT') {
          const { panelId, multiplier } = msg;
          const player = activePlayers.find(p => p.socketId === socketId && p.panelId === panelId && !p.cashedOut);
          if (player) {
            player.cashedOut = true;
            player.multiplier = parseFloat(multiplier.toFixed(2));
            player.payoutAmount = parseFloat((player.betAmount * multiplier).toFixed(2));

            broadcast({
              type: 'PLAYER_CASHED_OUT',
              playerId: player.id,
              activePlayers,
              cashedOutBettor: {
                username: player.username,
                multiplier: player.multiplier,
                payoutAmount: player.payoutAmount
              }
            });
          }
        } else if (msg.type === 'CHAT_MESSAGE') {
          const { sender, text, vipLevel } = msg;
          const chatMsg = {
            id: `chat_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
            sender: sender || 'User',
            text: text || '',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            vipLevel: vipLevel || 'Bronze'
          };
          broadcast({
            type: 'CHAT_BROADCAST',
            message: chatMsg
          });
        }
      } catch (e) {
        console.error('[WS Server Message Error]:', e);
      }
    });

    ws.on('close', () => {
      socketMap.delete(socketId);
      if (currentPhase === 'lobby') {
        activePlayers = activePlayers.filter(p => !(p.socketId === socketId && !p.queuedForNextRound));
        broadcast({
          type: 'LOBBY_BET_UPDATE',
          activePlayers
        });
      }
    });
  });

  // Vite integration middleware based on runtime environment
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind the HTTP server containing standard routes and WS listeners to port 3000
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Fullstack Server] Running securely on port ${PORT}`);
  });
}

startServer();
