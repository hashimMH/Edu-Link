'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  useConnectionState,
  useTracks,
  useRemoteParticipants,
  useLocalParticipant,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Users,
  Shield, MonitorUp, Sparkles, MoreVertical,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  VideoRenderer – attaches a media track to a <video> element       */
/* ------------------------------------------------------------------ */
function VideoRenderer({
  track,
  muted = false,
  mirror = false,
}: {
  track?: MediaStreamTrack;
  muted?: boolean;
  mirror?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !track) return;
    const stream = new MediaStream([track]);
    el.srcObject = stream;
    return () => { el.srcObject = null; };
  }, [track]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={`w-full h-full object-cover ${mirror ? '-scale-x-100' : ''}`}
    />
  );
}

/* ================================================================== */
/*  PAGE                                                                */
/* ================================================================== */
export default function LiveClassPage() {
  const params = useParams();
  const router = useRouter();
  const roomName = params.roomId as string;
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const authToken = localStorage.getItem('teacher_token');
        if (!authToken) { setError('Not authenticated'); setLoading(false); return; }
        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken },
          body: JSON.stringify({ roomName }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!data.success) throw new Error(data.message);
        setToken(data.data.token);
        setWsUrl(data.data.wsUrl);
      } catch (err: any) { if (!cancelled) setError(err.message || 'Failed to join'); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [roomName]);

  if (loading) {
    return (
      <div className="h-screen bg-[#202124] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-[3px] border-gray-600 border-t-blue-500 animate-spin" />
        <p className="text-gray-300 text-sm font-medium">Joining...</p>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="h-screen bg-[#202124] flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <Shield size={28} className="text-red-400" />
        </div>
        <p className="text-red-300 text-sm max-w-sm text-center">{error || 'Could not join'}</p>
        <button onClick={() => router.back()}
          className="mt-3 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#202124] flex flex-col overflow-hidden">
      <LiveKitRoom
        serverUrl={wsUrl}
        token={token}
        connect={true}
        audio={true}
        video={true}
        options={{ adaptiveStream: true, dynacast: true }}
        onDisconnected={() => router.back()}
        className="flex flex-col flex-1 min-h-0"
      >
        <MeetRoom roomName={roomName} onLeave={() => router.back()} />
      </LiveKitRoom>
    </div>
  );
}

/* ================================================================== */
/*  MEET ROOM                                                          */
/* ================================================================== */
function MeetRoom({ roomName, onLeave }: { roomName: string; onLeave: () => void }) {
  const state = useConnectionState();
  const tracks = useTracks();
  const remoteParticipants = useRemoteParticipants();
  const { localParticipant } = useLocalParticipant();
  const totalPeople = (localParticipant ? 1 : 0) + remoteParticipants.length;

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const localCamPub = localParticipant?.getTrackPublication(Track.Source.Camera);
  const localCamTrack = localCamPub?.track?.mediaStreamTrack;

  const toggleMic = useCallback(() => {
    const next = !micOn;
    const pub = localParticipant?.getTrackPublication(Track.Source.Microphone);
    if (pub?.track) {
      if (next) pub.track.unmute();
      else pub.track.mute();
    }
    setMicOn(next);
  }, [micOn, localParticipant]);

  const toggleCam = useCallback(() => {
    const next = !camOn;
    const pub = localParticipant?.getTrackPublication(Track.Source.Camera);
    if (pub?.track) {
      if (next) pub.track.unmute();
      else pub.track.mute();
    }
    setCamOn(next);
  }, [camOn, localParticipant]);

  const getRemoteVideo = (sid: string) => {
    const t = tracks.find(
      x => x.participant.sid === sid &&
        (x.publication?.kind === 'video' || x.source === Track.Source.Camera)
    );
    return t?.publication?.track?.mediaStreamTrack;
  };

  const mainRemote = remoteParticipants[0];
  const mainVideo = mainRemote ? getRemoteVideo(mainRemote.sid) : undefined;

  return (
    <>
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-5 py-2 flex-shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <Sparkles size={16} className="text-blue-400" />
          <span className="text-white text-sm font-semibold">Live Class</span>
          <span className="w-1 h-1 rounded-full bg-gray-600" />
          <span className="text-gray-500 text-[10px] font-mono hidden sm:inline">{roomName.slice(0, 12)}...</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
            state === 'connected' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${state === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
            {state === 'connected' ? 'Live' : state}
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#2D2E31] text-gray-300 text-[11px]">
            <Users size={13} />
            {totalPeople}
          </div>
          <button className="p-1 rounded-full hover:bg-[#3C4043] text-gray-400 transition">
            <MoreVertical size={16} />
          </button>
        </div>
      </header>

      {/* ── Video area ── */}
      <main className="flex-1 flex items-center justify-center px-3 pb-2 relative min-h-0">
        {remoteParticipants.length > 0 ? (
          <>
            {/* Remote participant – fills available space */}
            <div className="w-full h-full rounded-2xl overflow-hidden bg-[#3C4043] flex items-center justify-center relative">
              {mainVideo ? (
                <VideoRenderer track={mainVideo} />
              ) : (
                <Avatar name={mainRemote?.name || mainRemote?.identity || 'Student'} size="lg" />
              )}
              <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                {mainRemote?.name || mainRemote?.identity || 'Student'}
              </div>
            </div>

            {/* Local PIP */}
            <div className="absolute bottom-3 right-3 w-44 aspect-video rounded-lg overflow-hidden bg-[#2D2E31] shadow-2xl border-2 border-gray-700">
              {camOn && localCamTrack ? (
                <VideoRenderer track={localCamTrack} muted mirror />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#2D2E31]">
                  <Avatar name="You" />
                </div>
              )}
              <div className="absolute bottom-1.5 left-1.5 bg-black/50 backdrop-blur-sm text-white text-[9px] px-2 py-0.5 rounded-full">
                You
              </div>
            </div>

            {/* Extra remote participants */}
            {remoteParticipants.length > 1 && (
              <div className="absolute top-3 right-3 flex flex-col gap-1.5 max-h-[50%] overflow-y-auto">
                {remoteParticipants.slice(1).map(p => (
                  <ExtraRemoteTile key={p.sid} participant={p} getVideo={getRemoteVideo} />
                ))}
              </div>
            )}
          </>
        ) : (
          camOn && localCamTrack ? (
            <div className="w-full h-full rounded-2xl overflow-hidden bg-[#3C4043] relative">
              <VideoRenderer track={localCamTrack} muted mirror />
              <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                You (Teacher)
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-[#3C4043] flex items-center justify-center animate-pulse">
                <Users size={32} className="text-gray-500" />
              </div>
              <p className="text-gray-300 text-sm font-medium">Waiting for student to join</p>
              <div className="px-3 py-1.5 bg-[#2D2E31] rounded-lg border border-gray-700 text-gray-400 text-[10px] font-mono select-all">
                {roomName}
              </div>
            </div>
          )
        )}
      </main>

      {/* ── Control bar ── */}
      <footer className="flex items-center justify-center gap-2.5 px-4 py-2.5 flex-shrink-0">
        <div className="flex items-center gap-1 bg-[#2D2E31] rounded-full px-1 py-1 shadow-lg">
          <ControlBtn
            icon={micOn ? <Mic size={18} /> : <MicOff size={18} />}
            active={micOn}
            onClick={toggleMic}
            label={micOn ? 'Mute' : 'Unmute'}
          />
          <ControlBtn
            icon={camOn ? <Video size={18} /> : <VideoOff size={18} />}
            active={camOn}
            onClick={toggleCam}
            label={camOn ? 'Camera' : 'Camera'}
          />
          <ControlBtn
            icon={<MonitorUp size={18} />}
            active
            onClick={() => {}}
            label="Present"
          />
        </div>
        <button
          onClick={onLeave}
          className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg shadow-red-600/20 transition-colors"
        >
          <PhoneOff size={18} className="text-white" />
        </button>
      </footer>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Avatar placeholder                                                 */
/* ------------------------------------------------------------------ */
function Avatar({ name, size = 'md' }: { name?: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-12 h-12 text-base',
    lg: 'w-20 h-20 text-2xl',
  };
  return (
    <div className={`${dims[size]} rounded-full bg-[#4C4F55] flex items-center justify-center`}>
      <span className="text-white font-medium">
        {(name || '?').charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ExtraRemoteTile – compact sidebar tile                             */
/* ------------------------------------------------------------------ */
function ExtraRemoteTile({
  participant,
  getVideo,
}: {
  participant: { sid: string; name?: string; identity?: string };
  getVideo: (sid: string) => MediaStreamTrack | undefined;
}) {
  const video = getVideo(participant.sid);
  const name = participant.name || participant.identity || 'User';

  return (
    <div className="w-36 aspect-video rounded-md overflow-hidden bg-[#3C4043] border border-gray-700 shadow-lg relative">
      {video ? <VideoRenderer track={video} /> : <Avatar name={name} size="sm" />}
      <div className="absolute bottom-1 left-1 bg-black/50 backdrop-blur-sm text-white text-[8px] px-1.5 py-0.5 rounded-full">
        {name}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Control button                                                     */
/* ------------------------------------------------------------------ */
function ControlBtn({
  icon, active, onClick, label,
}: {
  icon: React.ReactNode; active: boolean; onClick: () => void; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all relative group ${
        active
          ? 'text-gray-200 hover:bg-[#4C4F55]'
          : 'bg-red-600 text-white hover:bg-red-700'
      }`}
      title={label}
    >
      {icon}
      <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[#1F1F1F] text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {label}
      </span>
    </button>
  );
}
