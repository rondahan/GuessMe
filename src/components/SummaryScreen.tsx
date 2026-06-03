import React from 'react';
import { Player, TurnLog } from '../types';
import LucideIcon from './LucideIcon';

interface SummaryScreenProps {
  players: Player[];
  logs: TurnLog[];
  categoryName: string;
  onRestart: () => void;
  isHost: boolean;
  isLoading: boolean;
}

export default function SummaryScreen({ players, logs, categoryName, onRestart, isHost, isLoading }: SummaryScreenProps) {
  // Compute basic statistics
  const winners = players.filter((p) => p.guessedCorrectly === true);
  const losers = players.filter((p) => p.guessedCorrectly === false || p.guessedCorrectly === null);

  return (
    <div className="w-full max-w-xl mx-auto space-y-8 animate-fade-in text-right" id="summary_screen_container">
      
      {/* Celebration Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-full text-white mx-auto shadow-xl">
          <LucideIcon name="Award" size={24} />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            סיכום המשחק • הקבינט הכריע!
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm">
            הנה תוצאות הדו-קרב החברתי המשוגע שלכם בקטגוריה <strong className="text-white">"{categoryName}"</strong>.
          </p>
        </div>
      </div>

      {/* Primary Winners List & Medals */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-6 shadow-2xl relative">
        <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-teal-500 via-zinc-800 to-transparent"></div>
        
        {/* Winners Section */}
        <div className="space-y-3">
          <h2 className="text-xs font-mono font-bold tracking-wider text-emerald-400 flex items-center gap-1.5 justify-end">
            <span>אלופי הניחושים (הצליחו בגדול) 👑</span>
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          </h2>
          
          {winners.length === 0 ? (
            <div className="p-4 bg-zinc-900/30 border border-zinc-900 rounded-xl text-center text-xs text-zinc-500 font-light">
              אף אחד לא הצליח לנחש השבוע... פעם הבאה תבחרו קטגוריה קלה יותר! 🤭
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {winners.map((p) => (
                <div key={p.id} className="p-4 bg-zinc-900/20 border border-zinc-850 rounded-xl flex justify-between items-center bg-gradient-to-r from-zinc-950 to-zinc-900/20">
                  <div className="text-xs font-semibold text-emerald-400">
                    בינגו! 💥
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-white text-sm">{p.name}</div>
                      <div className="text-[11px] text-zinc-400">הדמות: <strong className="text-zinc-300 font-medium">{p.character}</strong></div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-950/50 text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-900">
                      🏅
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Failed Guessers Section */}
        <div className="space-y-3 pt-2">
          <h2 className="text-xs font-mono font-bold tracking-wider text-zinc-500 flex items-center gap-1.5 justify-end">
            <span>אלה שנשארו באפילה (פספסו או לא ניחשו) 🤐</span>
            <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full"></span>
          </h2>

          {losers.length === 0 ? (
            <div className="p-4 bg-zinc-900/30 border border-zinc-900 rounded-xl text-center text-xs text-emerald-400">
              כולם ניחשו! מדהים! השולחן הכי חריף במזרח התיכון! 🧠
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {losers.map((p) => (
                <div key={p.id} className="p-4 bg-black/45 border border-zinc-900 rounded-xl flex justify-between items-center">
                  <div className="text-[11px] text-zinc-500 font-mono font-medium">
                    לא נורא...
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-zinc-300 text-sm">{p.name}</div>
                      <div className="text-[11px] text-zinc-550 text-zinc-400">הדמות שלו/ה הייתה: <strong className="text-zinc-305 font-medium text-zinc-300">{p.character || 'טרם נקבע'}</strong></div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-zinc-900 text-zinc-650 flex items-center justify-center font-bold text-xs border border-zinc-800">
                      ❔
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Match Q&A Logs Summary */}
      {logs.length > 0 && (
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-3.5 shadow-xl">
          <h3 className="text-xs font-mono font-bold tracking-wider text-zinc-400 pb-2 border-b border-zinc-900">
            תקציר הישגים ושאילתות מהשירשור החברתי:
          </h3>
          <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
            {logs.map((log, k) => (
              <div key={k} className="p-2.5 bg-black/40 rounded-lg border border-zinc-900 text-xs flex justify-between items-center">
                <span className="text-zinc-600 text-[10px] font-mono">{log.timestamp}</span>
                <span className="text-zinc-400 text-right">
                  שחקן <strong className="text-white">{log.playerName}</strong> {log.result === 'yes' ? 'קיבל מענה נכון! 👍' : log.result === 'no' ? 'קיבל מענה לא נכון! 👎' : 'קיבל מענה נייטרלי/חשוד 🧐'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-2.5 pt-2">
        {isHost ? (
          <button
            type="button"
            onClick={onRestart}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-zinc-200 text-black font-extrabold py-4 rounded-xl transition tracking-wide text-xs select-none shadow-md active:scale-[0.98] cursor-pointer"
            id="btn_restart_lobby"
          >
            <LucideIcon name="RotateCcw" size={14} className="text-black" />
            <span>החזר את כולם ללובי (סבב חדש) 🔄</span>
          </button>
        ) : (
          <div className="p-4 bg-zinc-900/35 border border-zinc-900 rounded-xl text-center space-y-1">
            <div className="text-xs text-zinc-400 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
              <span>מחכים שמנהל החדר יחזיר את כולם ללובי...</span>
            </div>
            <p className="text-[10px] text-zinc-550 text-zinc-500">כשמנהל החדר יחזיר את כולם ללובי, הנייד שלך יעבור דף אוטומטית!</p>
          </div>
        )}
      </div>

    </div>
  );
}
