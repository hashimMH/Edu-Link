import React, {useState, useEffect, useMemo} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {
  LiveKitRoom, VideoTrack, useTracks,
  useRemoteParticipants, useLocalParticipant,
  useConnectionState,
} from '@livekit/react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {storage} from '../../../services/storage';

const API_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

type RouteParams = {
  LiveClassScreen: { roomName: string; className?: string };
};

export default function LiveClassScreen() {
  const route = useRoute<RouteProp<RouteParams, 'LiveClassScreen'>>();
  const navigation = useNavigation();
  const { roomName, className } = route.params;
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const authToken = await storage.getToken();
        const res = await fetch(`${API_HOST}/api/livekit/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ roomName }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!data.success) throw new Error(data.message);
        setToken(data.data.token);
        setWsUrl(data.data.wsUrl);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Could not connect');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [roomName]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#10A7DA" />
        <Text style={styles.loadingText}>Joining lesson...</Text>
      </SafeAreaView>
    );
  }

  if (error || !token || !wsUrl) {
    return (
      <SafeAreaView style={styles.centered}>
        <Icon name="alert-circle-outline" size={60} color="#EF4444" />
        <Text style={styles.errorText}>{error || 'Could not join'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={wsUrl}
      token={token}
      connect={true}
      audio={true}
      video={true}
      options={{ adaptiveStream: true, dynacast: true }}
    >
      <RoomView className={className || roomName} onLeave={() => navigation.goBack()} />
    </LiveKitRoom>
  );
}

function RoomView({
  className, onLeave,
}: {
  className: string; onLeave: () => void;
}) {
  const state = useConnectionState();
  const remoteParticipants = useRemoteParticipants();
  const localParticipant = useLocalParticipant();
  const tracks = useTracks();

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // Local camera track — taken directly from the local participant (stable ref)
  const localCameraPub = useMemo(
    () => localParticipant?.getTrackPublication?.('camera'),
    [localParticipant]
  );
  const hasLocalCamera = !!(localCameraPub?.track && !localCameraPub.isMuted && camOn);

  // Remote video tracks — stable filter
  const remoteVideoTracks = useMemo(
    () => tracks.filter(
      t => !t.participant.isLocal &&
        (t.publication?.kind === 'video' || t.source === 'camera')
    ),
    [tracks]
  );

  const toggleMic = () => {
    const next = !micOn;
    const micPub = localParticipant?.getTrackPublication?.('microphone');
    if (micPub?.track) {
      if (next) micPub.track.unmute();
      else micPub.track.mute();
    }
    setMicOn(next);
  };

  const toggleCam = () => {
    const next = !camOn;
    if (localCameraPub?.track) {
      if (next) localCameraPub.track.unmute();
      else localCameraPub.track.mute();
    }
    setCamOn(next);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{className}</Text>
        <View style={styles.connectionBadge}>
          <View style={[styles.connDot, state === 'connected' ? styles.connGreen : styles.connRed]} />
          <Text style={styles.connectionText}>
            {state === 'connected' ? `Live · ${remoteParticipants.length + 1} in room` : state}
          </Text>
        </View>
      </View>

      <View style={styles.videoGrid}>
        {/* Remote participants */}
        {remoteParticipants.map(p => {
          const videoTrack = remoteVideoTracks.find(t => t.participant.sid === p.sid);
          return (
            <View key={p.sid} style={styles.remoteVideo}>
              {videoTrack ? (
                <VideoTrack trackRef={videoTrack} style={styles.remoteVideoTrack} />
              ) : (
                <View style={styles.videoPlaceholder}>
                  <Icon name="person-circle-outline" size={50} color="#666" />
                  <Text style={styles.placeholderText}>{p.name || p.identity || 'User'}</Text>
                </View>
              )}
              <Text style={styles.participantName}>
                {p.name || p.identity || 'Participant'}
              </Text>
            </View>
          );
        })}

        {/* Local PIP — always visible, shows camera or placeholder */}
        <View style={styles.localVideo}>
          {hasLocalCamera ? (
            <VideoTrack
              trackRef={{
                participant: localParticipant as any,
                publication: localCameraPub as any,
                source: 'camera' as any,
              }}
              style={styles.localVideoTrack}
            />
          ) : (
            <View style={styles.videoPlaceholder}>
              <Icon name="person-circle-outline" size={30} color="#666" />
              <Text style={styles.placeholderText}>You</Text>
            </View>
          )}
        </View>

        {/* No remote participants */}
        {remoteParticipants.length === 0 && (
          <View style={styles.waitingContainer}>
            <Icon name="people-outline" size={50} color="#666" />
            <Text style={styles.waitingText}>Waiting for others to join...</Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <ControlBtn icon={micOn ? 'mic-outline' : 'mic-off-outline'} label="Mic" active={micOn} onPress={toggleMic} />
        <ControlBtn icon={camOn ? 'videocam-outline' : 'videocam-off-outline'} label="Cam" active={camOn} onPress={toggleCam} />
        <ControlBtn icon="call-outline" label="Leave" active={false} danger onPress={() => {
          Alert.alert('Leave lesson?', '', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Leave', style: 'destructive', onPress: onLeave },
          ]);
        }} />
      </View>
    </SafeAreaView>
  );
}

function ControlBtn({ icon, label, active, danger, onPress }: {
  icon: string; label: string; active: boolean; danger?: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.controlButton} onPress={onPress}>
      <View style={[styles.controlIcon, danger ? styles.dangerIcon : active ? styles.activeIcon : styles.inactiveIcon]}>
        <Icon name={icon} size={24} color={danger ? '#fff' : active ? '#10A7DA' : '#fff'} />
      </View>
      <Text style={styles.controlLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827', padding: 24 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 16 : 40, paddingBottom: 8,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  connectionBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  connDot: { width: 8, height: 8, borderRadius: 4 },
  connGreen: { backgroundColor: '#10B981' },
  connRed: { backgroundColor: '#EF4444' },
  connectionText: { color: '#9CA3AF', fontSize: 12 },
  videoGrid: { flex: 1, padding: 8 },
  localVideo: {
    width: 130, height: 190, position: 'absolute', top: 8, right: 8, zIndex: 10,
    borderRadius: 12, overflow: 'hidden', backgroundColor: '#1F2937',
  },
  localVideoTrack: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  remoteVideo: { flex: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1F2937', marginBottom: 8 },
  remoteVideoTrack: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  videoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#9CA3AF', fontSize: 11, marginTop: 4 },
  participantName: {
    position: 'absolute', bottom: 8, left: 8, color: '#fff', fontSize: 13,
    fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 6,
  },
  waitingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  waitingText: { color: '#D1D5DB', fontSize: 16, marginTop: 12 },
  controls: {
    flexDirection: 'row', justifyContent: 'center', gap: 32,
    paddingVertical: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    backgroundColor: '#1F2937',
  },
  controlButton: { alignItems: 'center', gap: 6 },
  controlIcon: {
    width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center',
  },
  activeIcon: { backgroundColor: '#fff' },
  inactiveIcon: { backgroundColor: '#374151' },
  dangerIcon: { backgroundColor: '#EF4444' },
  controlLabel: { color: '#9CA3AF', fontSize: 11 },
  loadingText: { color: '#fff', marginTop: 12, fontSize: 16 },
  errorText: { color: '#FCA5A5', fontSize: 16, textAlign: 'center', marginTop: 12 },
  retryBtn: { marginTop: 20, backgroundColor: '#10A7DA', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
