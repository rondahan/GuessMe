import React, { useState } from 'react';
import { Player, Category, Room } from '../types';
import { ISRAELI_CATEGORIES } from '../data';
import LucideIcon from './LucideIcon';

interface LobbyScreenProps {
  room: Room;
  players: Player[];
  currentPlayer: Player;
  onUpdateCategory: (categoryId: string, categoryName: string) => Promise<void>;
  onStartGame: (customCharactersMap: Record<string, string>) => Promise<void>;
  onLeaveRoom: () => Promise<void>;
  isLoading: boolean;
}

export default function LobbyScreen({
  room,
  players,
  currentPlayer,
  onUpdateCategory,
  onStartGame,
  onLeaveRoom,
  isLoading
}: LobbyScreenProps) {
  // Input for custom characters if custom pack is active
  const [customCharInput, setCustomCharInput] = useState('');
  const [submittedChar, setSubmittedChar] = useState('');

  const isHost = currentPlayer.id === room.creatorId;

  // Handle custom character submission
  const handleSubmitCustomChar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCharInput.trim()) return;
    setSubmittedChar(customCharInput.trim());
  };

  const handleStart = async () => {
    // Collect all players' submitted custom characters if is custom pack
    const customCharactersMap: Record<string, string> = {};
    
    if (room.categoryId === 'custom') {
      // If it's custom pack, let's collect the character input we wrote locally or fetch from players
      // Wait, we can just grab from players list in Firestore since they type them!
      players.forEach(p => {
        // If current player is us, we can use our state. For others, we read their p.character if typed!
        // We will pass the map to App.tsx which handles state updating
        if (p.id === currentPlayer.id) {
          customCharactersMap[p.id] = submittedChar || customCharInput || 'דמות פלאגפלייר';
        } else {
          customCharactersMap[p.id] = p.character || 'טיפוס מעניין';
        }
      });
    }
    
    await onStartGame(customCharactersMap);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-fade-in text-right" id="lobby_screen_wrapper">
      
      {/* Upper Status indicators */}
      <div className="flex justify-between items-center bg-zinc-950/40 border border-zinc-900 rounded-xl px-4 py-3 sm:px-6" id="lobby_status_bar">
        <button
          type="button"
          onClick={onLeaveRoom}
          className="text-xs text-zinc-500 hover:text-red-400 font-bold transition flex items-center gap-1.5 font-mono cursor-pointer"
        >
          <LucideIcon name="LogOut" size={12} />
          <span>צא מהשולחן 🚪</span>
        </button>
        <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>מחובר לשולחן</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* RIGHT SIDEBAR: Room Code display and instructions */}
        <div className="md:col-span-5 bg-zinc-950 border border-zinc-900 rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
          <div className="space-y-4">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-zinc-500 block">קוד החדר המשותף</span>
            <div className="bg-black/40 border border-zinc-900 rounded-xl p-4 text-center select-all cursor-pointer hover:border-zinc-800 transition">
              <div className="text-4xl font-black text-white tracking-[0.3em] font-mono select-all">
                {room.code}
              </div>
              <p className="text-[10px] text-zinc-500 font-mono mt-2">
                *שתף את הקוד הזה עם חברים
              </p>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-light">
              החברים צריכים ללכת לבלוג של המשחק, לבחור באפשרות "הצטרף לחדר קיים" ולהקליד את הקוד כדי להשתחל לשולחן המסיבה!
            </p>
          </div>

          <div className="border-t border-zinc-900 pt-4">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-2 font-mono">שחקנים בלובי ({players.length})</span>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {players.map((p) => (
                <div 
                  key={p.id} 
                  className="flex items-center justify-between py-2 px-3 bg-zinc-900/30 border border-zinc-900/50 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    {p.isCreator && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-550/15 text-amber-300 text-[9px] font-bold border border-amber-900/40">
                        מנהל
                      </span>
                    )}
                    {p.id === currentPlayer.id && (
                      <span className="text-zinc-500 text-[10px] font-mono">(אתה)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{p.name}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LEFT COMPONENT: Category settings or waiting panel */}
        <div className="md:col-span-7 bg-zinc-950 border border-zinc-900 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative">
          <div className="space-y-6">
            
            {/* Host Section */}
            {isHost ? (
              <div className="space-y-4">
                <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-zinc-500 block">02 / סוג חבילת נושא סודית</span>
                <div className="grid grid-cols-1 gap-2">
                  {ISRAELI_CATEGORIES.map((cat) => {
                    const isActive = room.categoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => onUpdateCategory(cat.id, cat.name)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-right transition ${
                          isActive
                            ? 'bg-zinc-900/60 border-zinc-700'
                            : 'bg-zinc-955 border-zinc-900 hover:border-zinc-800'
                        }`}
                      >
                        <div className={`p-2 rounded-lg border ${
                          isActive ? 'bg-zinc-950 border-zinc-700 text-white shadow-xl' : 'bg-zinc-900 border-zinc-850 text-zinc-500'
                        }`}>
                          <LucideIcon name={cat.icon} size={14} />
                        </div>
                        <div className="flex-1">
                          <span className="font-bold text-xs text-white block">{cat.name}</span>
                          <span className="text-zinc-500 text-[10.5px] leading-tight font-light">{cat.description}</span>
                        </div>
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        )}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => onUpdateCategory('custom', 'חבילת החבר׳ה 🔒')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-right transition ${
                      room.categoryId === 'custom'
                        ? 'bg-zinc-900/60 border-zinc-700'
                        : 'bg-zinc-955 border-zinc-900 hover:border-zinc-800'
                    }`}
                  >
                    <div className={`p-2 rounded-lg border ${
                      room.categoryId === 'custom' ? 'bg-zinc-950 border-zinc-700 text-white shadow-xl' : 'bg-zinc-900 border-zinc-850 text-zinc-500'
                    }`}>
                      <LucideIcon name="Plus" size={14} />
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-xs text-white block">חבילת החבר׳ה 🔒 (בדיחות פנימיות!)</span>
                      <span className="text-zinc-500 text-[10.5px] leading-tight font-light">כל שחקן מעלה דמות משלו מהנייד.</span>
                    </div>
                    {room.categoryId === 'custom' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Non-Host Section */
              <div className="space-y-6">
                <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-zinc-500 block">פרטי המשחק הנוכחי</span>
                
                <div className="p-4 bg-zinc-900/40 rounded-xl border border-zinc-900 space-y-3">
                  <div className="text-xs text-zinc-400">חבילת המשחק שנבחרה ע"י מנהל החדר:</div>
                  <div className="flex items-center gap-2.5 bg-black/40 p-3 rounded-lg border border-zinc-900">
                    <div className="p-2 bg-zinc-900 border border-zinc-800 text-white rounded-md">
                      <LucideIcon name={room.categoryId === 'custom' ? 'Plus' : (ISRAELI_CATEGORIES.find(c => c.id === room.categoryId)?.icon || 'Sparkles')} size={16} />
                    </div>
                    <div className="font-black text-white text-base">
                      {room.categoryName}
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-light leading-relaxed">
                    {room.categoryId === 'custom' 
                      ? 'חברים, רשמו דמות שתושלך לקלחת ובדיחות פנימיות פה למטה!' 
                      : 'מנהל החדר יכול לשנות את הקטגוריה בכל רגע. ברגע שהוא יתחיל, הדמות הזמנית שלך תוגרל אוטומטית!'}
                  </p>
                </div>
              </div>
            )}

            {/* Custom Packs details & submit character block */}
            {room.categoryId === 'custom' && (
              <div className="p-4 bg-zinc-900/20 rounded-xl border border-dashed border-zinc-850 space-y-3.5">
                <div className="text-xs font-bold text-zinc-400">רשום אישית דמות סודית לחבר אחר:</div>
                
                {submittedChar ? (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-900/60 rounded-xl text-xs text-emerald-400 flex items-center justify-between">
                    <button 
                      type="button" 
                      onClick={() => setSubmittedChar('')} 
                      className="text-[10px] text-zinc-500 hover:text-zinc-300 underline font-mono"
                    >
                      ערוך מחדש
                    </button>
                    <span>הדמות נקלטה סגורה במגירה: <strong>"{submittedChar}"</strong> 👍</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitCustomChar} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={customCharInput}
                      onChange={(e) => setCustomCharInput(e.target.value)}
                      maxLength={30}
                      placeholder="למשל: סבתא יחזקאלוב, ביבי..."
                      className="flex-1 bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-700 text-white text-right font-medium placeholder-zinc-800"
                      dir="rtl"
                    />
                    <button
                      type="submit"
                      disabled={!customCharInput.trim()}
                      className="bg-white hover:bg-zinc-250 text-black px-4 py-2 rounded-lg text-xs font-bold transition disabled:opacity-40"
                    >
                      רשום דמות 🔒
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>

          <div className="pt-6 border-t border-zinc-900 mt-6 space-y-3">
            {isHost ? (
              <>
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={players.length < 2 || isLoading || (room.categoryId === 'custom' && players.some(p => p.id === currentPlayer.id ? !submittedChar : !p.character))}
                  className="w-full bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider rounded-xl py-4 transition flex items-center justify-center gap-2 disabled:opacity-30 cursor-pointer shadow-lg active:scale-98"
                >
                  <LucideIcon name="Flame" size={14} className="fill-black text-black" />
                  <span>התחל משחק ופזר דמויות! 🔥</span>
                </button>
                {players.length < 2 ? (
                  <p className="text-[10.5px] text-zinc-550 text-center text-zinc-500 font-mono">
                    *מחכים שלפחות עוד שחקן אחד יכנס ללובי כדי להפעיל
                  </p>
                ) : room.categoryId === 'custom' && players.some(p => p.id === currentPlayer.id ? !submittedChar : !p.character) ? (
                  <p className="text-[10.5px] text-amber-400 text-center font-mono animate-pulse">
                    *חלק מהשחקנים עדיין לא הזינו דמות מותאמת אישית!
                  </p>
                ) : null}
              </>
            ) : (
              <div className="py-3 text-center space-y-2 bg-zinc-900/30 rounded-xl border border-zinc-900/50">
                <div className="inline-flex gap-1.5 items-center justify-center text-xs text-zinc-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>מחכים שמנהל החדר יזניק את המשחק...</span>
                </div>
                <p className="text-[10px] text-zinc-550 text-zinc-500">
                  הוא קובע מתי מתחילים ואיזו חבילה תיחשף
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
