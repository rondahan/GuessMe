import React, { useState } from 'react';
import LucideIcon from './LucideIcon';

interface SetupScreenProps {
  onCreateRoom: (nickname: string) => Promise<void>;
  onJoinRoom: (roomCode: string, nickname: string) => Promise<void>;
  isLoading: boolean;
  error: string;
}

export default function SetupScreen({ onCreateRoom, onJoinRoom, isLoading, error }: SetupScreenProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const [formError, setFormError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const name = nickname.trim();
    if (!name) {
      setFormError('נא להזין כינוי שחקן!');
      return;
    }
    await onCreateRoom(name);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const name = nickname.trim();
    const code = roomCode.trim().toUpperCase();
    if (!name) {
      setFormError('נא להזין כינוי שחקן!');
      return;
    }
    if (!code || code.length !== 4) {
      setFormError('קוד חדר חייב להכיל 4 אותיות!');
      return;
    }
    await onJoinRoom(code, name);
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-8 animate-fade-in" id="setup_screen_container">
      {/* Dynamic Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-mono tracking-wide text-zinc-400">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          משחק מולטיפלייר - כל שחקן מהטלפון שלו 📱
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          נחש אותי <span className="text-zinc-500 font-light">?</span>
        </h1>
        <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed px-2">
          הגרסה הדיגיטלית לחידון הדמויות המדליק. כל חבר נכנס מהסמארטפון שלו, קוד חדר פשוט, וכולם רואים את של כולם חוץ מאת של עצמם!
        </p>
      </div>

      {/* Main tab switchers */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
        <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-emerald-550 via-zinc-800 to-transparent"></div>
        
        {/* Toggle selectors */}
        <div className="flex bg-zinc-900 p-1.5 rounded-xl border border-zinc-800/80">
          <button
            type="button"
            onClick={() => {
              setActiveTab('create');
              setFormError('');
            }}
            className={`flex-1 py-3 text-center rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-zinc-950 text-white shadow-md border border-zinc-800'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LucideIcon name="PlusCircle" size={14} />
            <span>פתח חדר משחק חדש</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setActiveTab('join');
              setFormError('');
            }}
            className={`flex-1 py-3 text-center rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'join'
                ? 'bg-zinc-950 text-white shadow-md border border-zinc-800'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LucideIcon name="LogIn" size={14} />
            <span>הצטרף לחדר קיים</span>
          </button>
        </div>

        {/* Create Room Form */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="space-y-2 text-right">
              <label htmlFor="creator_nickname_input" className="text-xs font-bold text-zinc-400 block font-mono">
                מה הכינוי שלך בחדר? 👀
              </label>
              <input
                id="creator_nickname_input"
                type="text"
                required
                disabled={isLoading}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={15}
                placeholder="למשל: עדן, שאולי, ליהיא..."
                className="w-full bg-zinc-900/40 border border-zinc-850 focus:border-zinc-500 focus:outline-none transition rounded-xl py-3.5 px-4 font-bold text-white text-base text-right placeholder-zinc-700"
                dir="auto"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !nickname.trim()}
              className="w-full bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider rounded-xl py-4 transition flex items-center justify-center gap-2 disabled:opacity-40 select-none shadow-lg cursor-pointer"
            >
              {isLoading ? (
                <span>יוצר חדר בדירקטוריון... 🪄</span>
              ) : (
                <>
                  <LucideIcon name="ChevronLeft" size={14} />
                  <span>קבל קוד חדר וכנס ללובי</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Join Room Form */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoin} className="space-y-5">
            <div className="space-y-2 text-right">
              <label htmlFor="join_room_code_input" className="text-xs font-bold text-zinc-400 block font-mono">
                קוד החדר המשותף 🔑 (4 אותיות באנגלית)
              </label>
              <input
                id="join_room_code_input"
                type="text"
                required
                disabled={isLoading}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={4}
                placeholder="למשל: MJKW"
                className="w-full bg-zinc-900/40 border border-zinc-850 focus:border-zinc-500 focus:outline-none transition rounded-xl py-4 px-4 font-black tracking-[0.4em] text-white text-xl text-center placeholder-zinc-700 focus:placeholder-transparent"
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="space-y-2 text-right">
              <label htmlFor="join_nickname_input" className="text-xs font-bold text-zinc-400 block font-mono">
                מה הכינוי שלך בחדר? 👀
              </label>
              <input
                id="join_nickname_input"
                type="text"
                required
                disabled={isLoading}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={15}
                placeholder="הכנס שם שחקן..."
                className="w-full bg-zinc-900/40 border border-zinc-850 focus:border-zinc-500 focus:outline-none transition rounded-xl py-3.5 px-4 font-bold text-white text-base text-right placeholder-zinc-700"
                dir="auto"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !nickname.trim() || roomCode.trim().length !== 4}
              className="w-full bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider rounded-xl py-4 transition flex items-center justify-center gap-2 disabled:opacity-40 select-none shadow-lg cursor-pointer"
            >
              {isLoading ? (
                <span>מתחבר לסיבוב... 🔗</span>
              ) : (
                <>
                  <LucideIcon name="LogIn" size={14} />
                  <span>הצטרף עכשיו!</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Simple error view */}
        {(formError || error) && (
          <div className="p-3.5 bg-red-950/35 border border-red-900 rounded-xl text-xs text-red-300 text-center flex items-center justify-center gap-2 animate-pulse" id="setup_error_banner">
            <LucideIcon name="AlertTriangle" size={14} />
            <span>{formError || error}</span>
          </div>
        )}
      </div>

      <div className="p-4 bg-zinc-900/30 border border-zinc-900 rounded-xl max-w-sm mx-auto text-center space-y-1.5">
        <h4 className="text-[11px] font-bold text-zinc-400">איך זה עובד? 🤔</h4>
        <p className="text-[10.5px] leading-relaxed text-zinc-500">
          אחד החברים לוחץ "פתח חדר" ובוחר קבוצת שאלות. שאר החברים מקלידים את קוד החדר בטלפון שלהם ונכנסים. ברגע שהמשחק מתחיל, כל טלפון מציג את השמות והדמויות של החברים, אבל הדמות של עצמך תישאר חסומה!
        </p>
      </div>

    </div>
  );
}
