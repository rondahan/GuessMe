import React, { useState, useEffect, useRef } from 'react';
import { Player, Room, TurnLog } from '../types';
import LucideIcon from './LucideIcon';

interface ActiveDashboardProps {
  room: Room;
  players: Player[];
  currentPlayer: Player;
  logs: TurnLog[];
  onUpdateRoom: (fields: Partial<Room>) => Promise<void>;
  onUpdatePlayer: (playerId: string, fields: Partial<Player>) => Promise<void>;
  onAddLog: (log: Omit<TurnLog, 'id'>) => Promise<void>;
  onFinishGame: () => Promise<void>;
  isLoading: boolean;
}

export default function ActiveDashboard({
  room,
  players,
  currentPlayer,
  logs,
  onUpdateRoom,
  onUpdatePlayer,
  onAddLog,
  onFinishGame,
  isLoading
}: ActiveDashboardProps) {
  const activePlayer = players[room.activePlayerIndex] || players[0];
  const isActiveMe = activePlayer?.id === currentPlayer?.id;

  // Local timer states initialized or reset based on room turnCount
  const [timeLeft, setTimeLeft] = useState<number>(room.timeLeft);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sound play helper on timer complete
  const playNativeAlert = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime); // 600Hz beep
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      // safe bypass
    }
  };

  // Synchronize dynamic timer count locally based on active player change or pause state
  useEffect(() => {
    // When turn count changes, reset local timer to the room's duration
    setTimeLeft(room.turnDuration);
  }, [room.turnCount, room.activePlayerIndex, room.turnDuration]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (room.isTimerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            playNativeAlert();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [room.isTimerRunning, room.turnCount, room.activePlayerIndex, timeLeft]);

  // Response tallies are synced in Firestore Room so everyone can see live!
  // Wait, let's see how we represent yesCount and noCount. We can store them in room document fields.
  // Wait! Let's check if the fields exist in room or players.
  // We can track yesCount and noCount in the room document!
  // Let's add them or use local states if not in room, but storing them in room document is much cleaner!
  // Let's assume Room doc has yesCount / noCount, if not we fall back gracefully.
  const roomYesCount = (room as any).yesCount || 0;
  const roomNoCount = (room as any).noCount || 0;

  // Handling yes/no votes
  const handleVote = async (type: 'yes' | 'no') => {
    if (type === 'yes') {
      await onUpdateRoom({ yesCount: roomYesCount + 1 } as any);
    } else {
      await onUpdateRoom({ noCount: roomNoCount + 1 } as any);
    }
  };

  const handleNextTurn = async () => {
    // Audit current response tallies and log them to timeline before transitioning
    if (roomYesCount > 0 || roomNoCount > 0) {
      await onAddLog({
        playerName: activePlayer.name,
        targetCharacter: activePlayer.character,
        result: roomYesCount > roomNoCount ? 'yes' : 'no',
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
    }

    const nextIndex = (room.activePlayerIndex + 1) % players.length;
    await onUpdateRoom({
      activePlayerIndex: nextIndex,
      turnCount: room.turnCount + 1,
      yesCount: 0,
      noCount: 0,
      isTimerRunning: true
    } as any);
  };

  // Guess state
  const [showGuessModal, setShowGuessModal] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const [guessRevealed, setGuessRevealed] = useState(false);

  // Validate guessed answer locally on guesser's phone
  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim()) return;
    setGuessRevealed(true);
  };

  const finalizeGuessStatus = async (isCorrect: boolean) => {
    // Record client result
    await onUpdatePlayer(currentPlayer.id, {
      hasGuessed: true,
      guessedCorrectly: isCorrect
    });

    // Write log entry
    await onAddLog({
      playerName: currentPlayer.name,
      targetCharacter: currentPlayer.character,
      result: isCorrect ? 'yes' : 'no',
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });

    // Clean local modal state
    setShowGuessModal(false);
    setGuessInput('');
    setGuessRevealed(false);

    // Auto-advance turn
    const nextIndex = (room.activePlayerIndex + 1) % players.length;
    await onUpdateRoom({
      activePlayerIndex: nextIndex,
      turnCount: room.turnCount + 1,
      yesCount: 0,
      noCount: 0,
      isTimerRunning: true
    } as any);
  };

  return (
    <div className="w-full space-y-6 text-right font-sans" id="active_dashboard_wrapper">
      
      {/* Top dashboard info */}
      <div className="flex justify-between items-center bg-zinc-950/40 border border-zinc-900 rounded-xl px-4 py-3 sm:px-6" id="game_status_top_bar">
        <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>מצב שולחן: {room.categoryName} ({room.id})</span>
        </div>
        <button
          type="button"
          onClick={onFinishGame}
          className="text-xs text-zinc-405 text-zinc-400 hover:text-white transition flex items-center gap-1.5 font-mono cursor-pointer"
          id="btn_end_game_early"
        >
          <LucideIcon name="Award" size={14} />
          <span>סיום משחק וסיכום 🏆</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-2">
        
        {/* RIGHT BAR: List of players and their status */}
        <aside className="lg:col-span-3 bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5 flex flex-col justify-between gap-6" id="active_players_list_sidebar">
          <div>
            <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] font-mono text-zinc-550 text-zinc-500 mb-4">חברי השולחן הזורמים</h3>
            <div className="space-y-2">
              {players.map((p, idx) => {
                const isCurrentActive = idx === room.activePlayerIndex;
                const isThisPlayerMe = p.id === currentPlayer.id;
                
                return (
                  <div 
                    key={p.id} 
                    className={`flex flex-col p-3.5 rounded-xl border text-right transition ${
                      isCurrentActive 
                        ? 'bg-zinc-900/80 border-zinc-700 shadow-md ring-1 ring-zinc-800' 
                        : 'bg-zinc-950/20 border-zinc-900/60 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isCurrentActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-800'}`}></div>
                        <span className="text-[10.5px] font-bold text-zinc-500">
                          {p.guessedCorrectly === true ? '🎉 ניחש' : p.guessedCorrectly === false ? '❌ פספס' : '🤔 מנוחש'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isThisPlayerMe && (
                          <span className="text-zinc-500 text-[10px] font-mono font-medium">(אתה)</span>
                        )}
                        <span className={`text-sm font-black ${isCurrentActive ? 'text-white' : 'text-zinc-350'}`}>
                          {p.name}
                        </span>
                      </div>
                    </div>

                    {/* SHOW secret character of OTHER players to you, but keep YOUR OWN character hidden */}
                    <div className="mt-2.5 pt-2 border-t border-zinc-900 flex justify-between items-center bg-black/20 px-2 py-1.5 rounded-lg border border-zinc-900/50">
                      <span className="text-[10px] text-zinc-600 font-mono">הדמות:</span>
                      
                      {isThisPlayerMe ? (
                        <span className="text-[11px] font-black text-amber-500/80 animate-pulse">
                          ❓ סודי ביותר (מוסתר!)
                        </span>
                      ) : (
                        <span className="text-xs font-black text-white">
                          {p.character || 'טרם חולק'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-900 to-black border border-zinc-850">
            <p className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 mb-1 font-mono">אין צורך לזכור! 🤫</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed italic">
              שחקו בכיף! כל חבר רואה על מסך הטלפון שלו את המלל של האחרים בשולחן, כך שתוכלו לענות זה לזה בקלילות בלי לאמץ את הזיכרון!
            </p>
          </div>
        </aside>

        {/* MIDDLE BAR: Active Question details */}
        <section className="lg:col-span-6 flex flex-col items-center justify-between space-y-6">
          
          {/* SYNC TIMER */}
          <div className="flex flex-col items-center bg-zinc-950/20 border border-zinc-900/50 rounded-2xl px-8 py-4 w-full">
            <span className="text-[10px] uppercase tracking-[0.3em] font-mono text-zinc-500 mb-1">טיימר מקומי</span>
            <div className="flex items-center gap-3">
              <div className={`text-5xl font-mono tracking-tighter ${
                timeLeft <= 10 && timeLeft > 0 ? 'text-red-500 animate-pulse font-black' : 'text-white font-black'
              }`}>
                {timeLeft < 10 ? `00:0${timeLeft}` : `00:${timeLeft}`}
              </div>
              
              {/* Reset/Pause controls for Host */}
              {currentPlayer.isCreator && (
                <div className="flex gap-1 mr-4">
                  <button
                    type="button"
                    onClick={() => onUpdateRoom({ isTimerRunning: !room.isTimerRunning })}
                    className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-zinc-400 hover:text-white transition cursor-pointer"
                    title={room.isTimerRunning ? 'השהה' : 'המשך'}
                  >
                    <LucideIcon name={room.isTimerRunning ? 'Pause' : 'Play'} size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateRoom({ turnCount: room.turnCount + 1 })}
                    className="p-1.5 bg-zinc-900 border border-zinc-805 rounded-md text-xs text-zinc-400 hover:text-white transition cursor-pointer"
                    title="אפס שלב"
                  >
                    <LucideIcon name="RotateCcw" size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* PLAY AND ANSWER CARDS */}
          <div className="relative group w-full max-w-sm">
            <div className="absolute inset-0 bg-white/[0.02] blur-3xl rounded-full scale-110 pointer-events-none"></div>
            
            <div className="relative bg-zinc-950 border border-zinc-850 rounded-2xl flex flex-col items-center justify-center p-6 sm:p-8 shadow-2xl space-y-5 text-center">
              
              {isActiveMe ? (
                <>
                  <div className="absolute top-6 right-6">
                    <span className="px-2 py-0.5 rounded bg-zinc-90 w-[80px] bg-emerald-950/20 text-emerald-400 border border-emerald-900/60 text-[10px] font-mono font-bold">
                      זה סיבוב שלך!
                    </span>
                  </div>

                  <div className="mb-2 text-zinc-600 mt-2">
                    <LucideIcon name="HelpCircle" size={48} className="text-emerald-400 animate-pulse" />
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-zinc-550 text-[11px] font-semibold tracking-wider uppercase font-mono">התפקיד שלך לשאול:</h2>
                    <h1 className="text-3xl font-black text-white">נו, מי אני? 🤔</h1>
                  </div>

                  <div className="w-full bg-zinc-900/40 rounded-xl flex flex-col items-center justify-center border border-dashed border-zinc-800 p-5 min-h-[140px] relative">
                    <p className="text-xs text-zinc-350 text-center leading-relaxed">
                      שאל את החברים בשולחן שאלות של <strong>כן / לא</strong> כדי לנסות לגשש ולזהות את הדמות שלך!
                    </p>
                    <span className="text-[10px] text-zinc-500 font-mono mt-3">
                      *הדמות מוסתרת לחלוטין מהמסך שלך למניעת ספוילרים
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowGuessModal(true)}
                    className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider rounded-xl transition shadow-md cursor-pointer select-none"
                    id="active_btn_guess"
                  >
                    יש לי ניחוש! 💥
                  </button>
                </>
              ) : (
                <>
                  <div className="absolute top-6 right-6 animate-pulse">
                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-amber-400">
                      מקשיב בשולחן
                    </span>
                  </div>

                  <div className="mb-2 text-zinc-650 mt-2">
                    <LucideIcon name="Users" size={48} className="text-zinc-600" />
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-zinc-550 text-[11px] font-semibold tracking-wider uppercase font-mono">ענו כרגע ל:</h2>
                    <h1 className="text-3xl font-black text-white">{activePlayer?.name || 'חבר שולחן'}</h1>
                  </div>

                  <div className="w-full bg-zinc-900/60 rounded-xl flex flex-col items-center justify-center border border-zinc-800/80 p-5 min-h-[140px]">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 mb-1">הזהות הסודית של {activePlayer?.name} היא:</span>
                    <div className="text-2xl font-black text-emerald-400 tracking-wide">
                      {activePlayer?.character || 'מחפש בחוזים...'}
                    </div>
                  </div>

                  <div className="w-full p-3 bg-zinc-900/20 border border-zinc-850 rounded-xl text-center">
                    <p className="text-[11.5px] text-zinc-400 leading-normal">
                      הוא שואל שאלות עכשיו, ענו לו ישירות בשולחן ב"כן" או "לא"!
                    </p>
                  </div>
                </>
              )}

            </div>
          </div>

          {/* VOTE YES/NO TALLY HUD */}
          <div className="w-full max-w-sm flex items-center justify-between gap-3 pt-3">
            <button
              type="button"
              onClick={() => handleVote('no')}
              className="flex-1 py-3.5 px-6 border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 text-xs font-semibold text-zinc-400 hover:text-white rounded-full flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              id="btn_log_no"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              <span>לא ({roomNoCount})</span>
            </button>
            
            <button
              type="button"
              onClick={() => handleVote('yes')}
              className="flex-1 py-3.5 px-6 border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 text-xs font-semibold text-zinc-400 hover:text-white rounded-full flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              id="btn_log_yes"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>כן ({roomYesCount})</span>
            </button>

            <button
              type="button"
              onClick={handleNextTurn}
              className="py-3.5 px-5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-full text-xs font-bold text-zinc-300 transition cursor-pointer"
            >
              הבא תור ⏭️
            </button>
          </div>

        </section>

        {/* LEFT BAR: Live Logs list */}
        <aside className="lg:col-span-3 bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5 flex flex-col justify-between gap-4" id="active_turns_history_timeline">
          <div>
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-mono text-zinc-500 border-b border-zinc-900 pb-2">יומן הקבינט 📜</h3>
            
            <div className="mt-4 space-y-4 max-h-[240px] overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <div className="text-zinc-650 text-center py-10 text-[11px] font-light">
                  אין פעילות רשומה כרגע. התחילו לשאול כדי לייצר היסטוריה! 🚀
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="text-[11.5px] leading-relaxed">
                    <span className="text-zinc-500 font-mono text-[10px]">{log.timestamp}: </span>
                    <span className="text-white font-bold">{log.playerName}</span>{' '}
                    <span>{log.result === 'yes' ? 'קיבל בעיקר תשובות כן! 👍' : 'קיבל בעיקר תשובות לא... 👎'}</span>
                    <div className="w-full h-[1px] bg-zinc-900 mt-2"></div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 bg-zinc-900/40 rounded-xl border border-zinc-800 mt-auto">
            <div className="flex items-center gap-2 mb-2 justify-end">
              <span className="text-[10px] font-bold text-zinc-400">אוקטבה חיה</span>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
            </div>
            <p className="text-[10px] text-zinc-500 text-right leading-relaxed font-mono">מצב ריבוי מכשירים מסוכרן. הפעילויות ברקע מסוכרנות בזמן אמת.</p>
          </div>
        </aside>

      </div>

      {/* GUESS CONSOLE MODAL */}
      {showGuessModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" id="guess_modal_overlay">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 space-y-6 text-center" id="guess_modal">
            
            <div className="space-y-2">
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-300">
                <LucideIcon name="HelpCircle" size={24} />
              </div>
              <h3 className="text-lg font-black text-white">זה הזמן לנחש!</h3>
              <p className="text-xs text-zinc-400">מה שם הדמות שאתה מאמין שאתה מעצב?</p>
            </div>

            {!guessRevealed ? (
              <form onSubmit={handleGuessSubmit} className="space-y-4">
                <input
                  type="text"
                  required
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  placeholder="הקלד שם סלבריטי או טיפוס..."
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl py-3.5 px-4 focus:outline-none focus:border-zinc-500 text-center font-bold text-white text-base placeholder-zinc-850"
                  dir="auto"
                  autoFocus
                />
                
                <button
                  type="submit"
                  disabled={!guessInput.trim()}
                  className="w-full bg-white text-black font-extrabold rounded-xl py-3 text-xs uppercase tracking-wider transition hover:bg-zinc-200 disabled:opacity-40 cursor-pointer"
                >
                  בדוק תאימות!
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowGuessModal(false);
                  }}
                  className="w-full text-zinc-500 hover:text-zinc-300 text-xs transition"
                >
                  בטל וחזור לשלב שאלות
                </button>
              </form>
            ) : (
              <div className="space-y-5">
                
                <div className="p-4 rounded-xl border border-zinc-900 bg-black/50 space-y-3.5">
                  <div className="text-[10px] font-bold text-zinc-500">הזהות המקורית המוגדרת עבורך</div>
                  <div>
                    <span className="text-zinc-450 text-[10.5px]">הדמות האמיתית שהייתה שלך:</span>
                    <div className="text-2xl font-black text-white tracking-wide mt-1 animate-pulse">
                      {currentPlayer.character}
                    </div>
                  </div>
                  <div className="border-t border-zinc-900 pt-2.5">
                    <span className="text-zinc-450 text-[10.5px]">הניחוש שהצעת בקוד החברים:</span>
                    <div className="text-base font-bold text-zinc-300 mt-0.5">
                      "{guessInput}"
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <span className="text-xs text-zinc-400 font-bold block leading-relaxed">
                    האם זיהית והקשת נכון? 🥂
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => finalizeGuessStatus(true)}
                      className="py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold rounded-xl text-xs transition cursor-pointer"
                    >
                      כן, צדקתי בול! 🎉
                    </button>
                    <button
                      type="button"
                      onClick={() => finalizeGuessStatus(false)}
                      className="py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-medium rounded-xl text-xs transition cursor-pointer"
                    >
                      לא, פספסתי... ❌
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
