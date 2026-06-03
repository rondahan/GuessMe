import React, { useState, useEffect } from 'react';
import { Player, Room, TurnLog } from './types';
import { ISRAELI_CATEGORIES } from './data';
import SetupScreen from './components/SetupScreen';
import LobbyScreen from './components/LobbyScreen';
import ActiveDashboard from './components/ActiveDashboard';
import SummaryScreen from './components/SummaryScreen';
import { db, getOrCreateClientUserId } from './lib/firebase';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  serverTimestamp,
  addDoc,
  query,
  orderBy,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';

// Fisher-Yates element shuffler for randomized character assignment
function shuffleList<T>(list: T[]): T[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Generate unique 4-letter upper case code (e.g. MJKW)
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(() => localStorage.getItem('guess_me_roomId'));
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [logs, setLogs] = useState<TurnLog[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Unsubscribe pointers
  const [unsubRoom, setUnsubRoom] = useState<(() => void) | null>(null);
  const [unsubPlayers, setUnsubPlayers] = useState<(() => void) | null>(null);
  const [unsubLogs, setUnsubLogs] = useState<(() => void) | null>(null);

  useEffect(() => {
    // If we have roomId on startup, try to subscribe and restore the session!
    if (roomId) {
      subscribeToRoom(roomId);
    }
    return () => {
      cleanupListeners();
    };
  }, []);

  const cleanupListeners = () => {
    if (unsubRoom) unsubRoom();
    if (unsubPlayers) unsubPlayers();
    if (unsubLogs) unsubLogs();
    setUnsubRoom(null);
    setUnsubPlayers(null);
    setUnsubLogs(null);
  };

  const subscribeToRoom = (code: string) => {
    cleanupListeners();
    setIsLoading(true);
    const userId = getOrCreateClientUserId();

    // 1. Subscribe to Room document
    const roomRef = doc(db, 'rooms', code);
    const uRoom = onSnapshot(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        setError('החדר נסגר או לא קיים!');
        handleLeaveRoom();
        setIsLoading(false);
        return;
      }
      const data = snapshot.data();
      setRoom({
        id: code,
        code: code,
        categoryName: data.categoryName || 'הביצה המקומית 🌟',
        categoryId: data.categoryId || 'celebs',
        status: data.status || 'lobby',
        creatorId: data.creatorId || '',
        activePlayerIndex: data.activePlayerIndex || 0,
        timeLeft: data.timeLeft || 60,
        isTimerRunning: !!data.isTimerRunning,
        turnDuration: data.turnDuration || 60,
        turnCount: data.turnCount || 0
      });
      setIsLoading(false);
    }, (err) => {
      console.error(err);
      setError('שגיאת תקשורת עם שרת המשחק');
      setIsLoading(false);
    });
    setUnsubRoom(() => uRoom);

    // 2. Subscribe to Players subcollection
    const playersRef = collection(db, 'rooms', code, 'players');
    const uPlayers = onSnapshot(playersRef, (snapshot) => {
      const pList: Player[] = [];
      let foundMe: Player | null = null;

      snapshot.forEach((pDoc) => {
        const data = pDoc.data();
        const pl: Player = {
          id: pDoc.id,
          name: data.name || '',
          character: data.character || '',
          guessedCorrectly: data.guessedCorrectly ?? null,
          hasGuessed: !!data.hasGuessed,
          avatarSeed: data.avatarSeed || 'av-0',
          isCreator: !!data.isCreator
        };
        pList.push(pl);
        if (pDoc.id === userId) {
          foundMe = pl;
        }
      });

      // Sort players by join order (using dynamic timestamp or name fallback)
      pList.sort((a, b) => a.name.localeCompare(b.name));

      setPlayers(pList);
      setCurrentPlayer(foundMe);
    }, (err) => {
      console.error(err);
    });
    setUnsubPlayers(() => uPlayers);

    // 3. Subscribe to turn log subcollection
    const logsRef = collection(db, 'rooms', code, 'logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'));
    const uLogs = onSnapshot(q, (snapshot) => {
      const lList: TurnLog[] = [];
      snapshot.forEach((lDoc) => {
        const data = lDoc.data();
        lList.push({
          id: lDoc.id,
          playerName: data.playerName || '',
          targetCharacter: data.targetCharacter || '',
          result: data.result || 'yes',
          timestamp: data.timestamp || ''
        });
      });
      setLogs(lList);
    }, (err) => {
      console.error(err);
    });
    setUnsubLogs(() => uLogs);
  };

  const handleCreateRoom = async (nickname: string) => {
    setIsLoading(true);
    setError('');
    try {
      const code = generateRoomCode();
      const userId = getOrCreateClientUserId();

      // Create Room document in Firestore
      const roomRef = doc(db, 'rooms', code);
      const roomData = {
        id: code,
        code: code,
        status: 'lobby',
        creatorId: userId,
        categoryName: 'הביצה המקומית 🌟',
        categoryId: 'celebs',
        activePlayerIndex: 0,
        timeLeft: 60,
        isTimerRunning: true,
        turnDuration: 60,
        turnCount: 0,
        createdAt: serverTimestamp(),
        yesCount: 0,
        noCount: 0
      };
      await setDoc(roomRef, roomData);

      // Create Player document
      const playerRef = doc(db, 'rooms', code, 'players', userId);
      const playerData = {
        id: userId,
        name: nickname,
        character: '',
        guessedCorrectly: null,
        hasGuessed: false,
        avatarSeed: `av-${Math.floor(Math.random() * 8)}`,
        isCreator: true,
        joinedAt: serverTimestamp()
      };
      await setDoc(playerRef, playerData);

      localStorage.setItem('guess_me_roomId', code);
      setRoomId(code);
      subscribeToRoom(code);
    } catch (err) {
      console.error(err);
      setError('לא הצלחנו לפתוח חדר מסיבה. נסה שוב!');
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (code: string, nickname: string) => {
    setIsLoading(true);
    setError('');
    const upperCode = code.toUpperCase().trim();
    try {
      // Check if room exists
      const roomRef = doc(db, 'rooms', upperCode);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        setError('קוד החדר שגוי או פג תוקף! ❌');
        setIsLoading(false);
        return;
      }

      const roomData = roomSnap.data();
      if (roomData.status !== 'lobby') {
        setError('המשחק בחדר זה כבר במעופו! 🚀 נסה ליצור חדר חדש.');
        setIsLoading(false);
        return;
      }

      const userId = getOrCreateClientUserId();

      // Create player document in room
      const playerRef = doc(db, 'rooms', upperCode, 'players', userId);
      const playerData = {
        id: userId,
        name: nickname,
        character: '',
        guessedCorrectly: null,
        hasGuessed: false,
        avatarSeed: `av-${Math.floor(Math.random() * 8)}`,
        isCreator: false,
        joinedAt: serverTimestamp()
      };
      await setDoc(playerRef, playerData);

      localStorage.setItem('guess_me_roomId', upperCode);
      setRoomId(upperCode);
      subscribeToRoom(upperCode);
    } catch (err) {
      console.error(err);
      setError('תקלה בהתחברות לחדר. בדוק את החיבור.');
      setIsLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    cleanupListeners();
    localStorage.removeItem('guess_me_roomId');
    setRoomId(null);
    setRoom(null);
    setPlayers([]);
    setLogs([]);
    setCurrentPlayer(null);
    setError('');
  };

  const handleUpdateCategory = async (categoryId: string, categoryName: string) => {
    if (!roomId) return;
    try {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, { categoryId, categoryName });
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartGame = async (customCharactersMap: Record<string, string>) => {
    if (!roomId || !room) return;
    setIsLoading(true);
    try {
      let characterPool: string[] = [];

      // Determine characters list to distribute
      if (room.categoryId === 'custom') {
        // Collect submitted characters
        characterPool = Object.values(customCharactersMap).filter((char) => !!char.trim());
        if (characterPool.length < players.length) {
          // Fill missing
          while (characterPool.length < players.length) {
            characterPool.push('ישראלי ממוצע');
          }
        }
      } else {
        const cat = ISRAELI_CATEGORIES.find((c) => c.id === room.categoryId);
        if (cat) {
          characterPool = [...cat.items];
        } else {
          characterPool = [...ISRAELI_CATEGORIES[0].items];
        }
      }

      // Shuffle characters
      characterPool = shuffleList(characterPool);

      // Distribute assignments ensuring no one gets their own custom character if possible
      // In firestore, use Batch Writes to write all configurations at once
      const batch = writeBatch(db);

      players.forEach((p, index) => {
        const assigned = characterPool[index % characterPool.length] || 'נועה קירל';
        const playerDocRef = doc(db, 'rooms', roomId, 'players', p.id);
        batch.update(playerDocRef, {
          character: assigned,
          guessedCorrectly: null,
          hasGuessed: false
        });
      });

      // Update room status
      const roomRef = doc(db, 'rooms', roomId);
      batch.update(roomRef, {
        status: 'active',
        activePlayerIndex: 0,
        turnCount: 1,
        isTimerRunning: true,
        timeLeft: 60,
        yesCount: 0,
        noCount: 0
      });

      await batch.commit();
    } catch (err) {
      console.error(err);
      setError('תקלה בחלוקת הדמויות לקליין.');
    } finally {
      setIsLoading(false);
    }
  };

  // Updaters for active board interaction
  const handleUpdateRoom = async (fields: Partial<Room>) => {
    if (!roomId) return;
    try {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, fields);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePlayer = async (playerId: string, fields: Partial<Player>) => {
    if (!roomId) return;
    try {
      const playerRef = doc(db, 'rooms', roomId, 'players', playerId);
      await updateDoc(playerRef, fields);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddLog = async (logFields: Omit<TurnLog, 'id'>) => {
    if (!roomId) return;
    try {
      const logsRef = collection(db, 'rooms', roomId, 'logs');
      await addDoc(logsRef, {
        ...logFields,
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleFinishGame = async () => {
    if (!roomId) return;
    try {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, { status: 'summary' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestartToLobby = async () => {
    if (!roomId) return;
    setIsLoading(true);
    try {
      const batch = writeBatch(db);

      // Update room details
      const roomRef = doc(db, 'rooms', roomId);
      batch.update(roomRef, {
        status: 'lobby',
        activePlayerIndex: 0,
        yesCount: 0,
        noCount: 0,
        turnCount: 0
      });

      // Reset each player
      players.forEach((p) => {
        const playerRef = doc(db, 'rooms', roomId, 'players', p.id);
        batch.update(playerRef, {
          character: '',
          guessedCorrectly: null,
          hasGuessed: false
        });
      });

      await batch.commit();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col selection:bg-white selection:text-black overflow-x-hidden relative" dir="rtl">
      
      {/* Header — below status bar / notch (safe-area) */}
      <header className="sticky top-0 z-40 border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md pt-[max(2.75rem,env(safe-area-inset-top,2.75rem))]">
        <div className="h-14 sm:h-16 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.15)]">
              <div className="w-3 h-3 bg-black rotate-45"></div>
            </div>
            <span className="text-lg font-bold tracking-tighter text-white font-sans">נחש אותי <span className="text-zinc-500 font-light">?</span></span>
          </div>

          {room && (
            <div className="flex items-center gap-3 md:gap-6">
              <div className="px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900 text-[11px] font-medium text-zinc-400">
                קוד חדר: <span className="text-white font-black tracking-wide font-mono">{room.code}</span>
              </div>
              <div className="h-4 w-[1px] bg-zinc-800 hidden sm:block"></div>
              <div className="text-xs text-zinc-400 hidden sm:block">
                חבילה: <span className="text-white font-semibold">{room.categoryName}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Subtle light leak */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[180px] bg-white/[0.02] blur-[120px] rounded-full pointer-events-none"></div>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 flex flex-col justify-start">
        {!room ? (
          <SetupScreen
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            isLoading={isLoading}
            error={error}
          />
        ) : (
          <>
            {room.status === 'lobby' && currentPlayer && (
              <LobbyScreen
                room={room}
                players={players}
                currentPlayer={currentPlayer}
                onUpdateCategory={handleUpdateCategory}
                onStartGame={handleStartGame}
                onLeaveRoom={handleLeaveRoom}
                isLoading={isLoading}
              />
            )}

            {room.status === 'active' && currentPlayer && (
              <ActiveDashboard
                room={room}
                players={players}
                currentPlayer={currentPlayer}
                logs={logs}
                onUpdateRoom={handleUpdateRoom}
                onUpdatePlayer={handleUpdatePlayer}
                onAddLog={handleAddLog}
                onFinishGame={handleFinishGame}
                isLoading={isLoading}
              />
            )}

            {room.status === 'summary' && currentPlayer && (
              <SummaryScreen
                players={players}
                logs={logs}
                categoryName={room.categoryName}
                onRestart={handleRestartToLobby}
                isHost={currentPlayer.isCreator}
                isLoading={isLoading}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
