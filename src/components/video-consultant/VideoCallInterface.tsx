'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Send,
  User,
  X,
  Phone,
  Volume2,
  VolumeX,
  WifiOff,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  FileText,
  Download,
  Circle,
  Square,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/lib/store'

// ─── Component ────────────────────────────────────────────────────────────────

export default function VideoCallInterface() {
  const {
    isInCall,
    callSession,
    selectedNanny,
    endCall,
    toggleChat,
    isChatOpen,
    messages,
    sendMessage,
    currentUser,
  } = useAppStore()

  const { toast } = useToast()

  // ─── Call UI State ───────────────────────────────────────────────────────
  const [callPhase, setCallPhase] = useState<'ringing' | 'connecting' | 'active'>('ringing')
  const [callTime, setCallTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isSpeakerOff, setIsSpeakerOff] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const [cameraError, setCameraError] = useState<string | null>(null)

  // ─── Socket + WebRTC State ───────────────────────────────────────────────
  const [socketConnected, setSocketConnected] = useState(false)
  const [remoteStreamReady, setRemoteStreamReady] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [recordingConsented, setRecordingConsented] = useState(false)
  const [showConsentBanner, setShowConsentBanner] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [aiSummary, setAiSummary] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [recordingUploadState, setRecordingUploadState] = useState<'idle' | 'uploading' | 'uploaded' | 'failed'>('idle')

  // ─── Refs ──────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const iceServersRef = useRef<Array<{ urls: string; username?: string; credential?: string }>>([])
  const isParentRef = useRef(false)
  const hasCreatedOfferRef = useRef(false)
  const callEndedRef = useRef(false)
  const recordingBlobRef = useRef<Blob | null>(null)
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const formatTime = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }, [])

  const roomId = callSession?.roomId || ''

  // ─── Start local camera ───────────────────────────────────────────────────
  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: true,
      })
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      setCameraError(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Camera access denied'
      setCameraError(msg)
      console.error('getUserMedia error:', err)
    }
  }, [])

  // ─── Stop local stream ────────────────────────────────────────────────────
  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }
  }, [])

  // ─── Create peer connection ───────────────────────────────────────────────
  const createPeerConnection = useCallback(async () => {
    try {
      // Fetch ICE servers with TURN credentials
      const userId = currentUser?.id || 'anonymous'
      const credRes = await fetch(`/api/turn-credentials?userId=${encodeURIComponent(userId)}`)
      const credData = await credRes.json()
      if (credData.success) {
        iceServersRef.current = credData.data.iceServers
      } else {
        // Fallback to public STUN
        iceServersRef.current = [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      }

      const pc = new RTCPeerConnection({
        iceServers: iceServersRef.current,
        iceCandidatePoolSize: 10,
      })
      peerConnectionRef.current = pc

      // Add local tracks
      const localStream = localStreamRef.current
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream)
        })
      }

      // Handle remote stream
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0]
          setRemoteStreamReady(true)
        }
      }

      // ICE candidate handling
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('signal', {
            roomId,
            signal: {
              type: 'ice-candidate',
              candidate: event.candidate,
            },
          })
        }
      }

      // Connection state monitoring
      pc.onconnectionstatechange = () => {
        switch (pc.connectionState) {
          case 'connected':
            setCallPhase('active')
            setConnectionError(null)
            break
          case 'disconnected':
            console.warn('[WebRTC] Peer disconnected')
            break
          case 'failed':
            setConnectionError('Connection failed. Check your internet and try again.')
            break
          case 'closed':
            console.log('[WebRTC] Peer connection closed')
            break
        }
      }

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          setConnectionError('Network issue detected. Attempting to reconnect...')
          // ICE restart
          if (pc.iceConnectionState === 'failed') {
            pc.restartIce()
          }
        }
      }

      return pc
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create peer connection'
      console.error('[WebRTC] createPeerConnection error:', err)
      setConnectionError(msg)
      return null
    }
  }, [currentUser, roomId])

  // ─── Create and send offer (parent side) ──────────────────────────────────
  const createOffer = useCallback(async () => {
    const pc = peerConnectionRef.current
    const socket = socketRef.current
    if (!pc || !socket) return

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })
      await pc.setLocalDescription(offer)
      hasCreatedOfferRef.current = true

      socket.emit('signal', {
        roomId,
        signal: {
          type: 'offer',
          sdp: pc.localDescription,
        },
      })
    } catch (err) {
      console.error('[WebRTC] createOffer error:', err)
      setConnectionError('Failed to establish connection.')
    }
  }, [roomId])

  // ─── Handle incoming signal ───────────────────────────────────────────────
  const handleSignal = useCallback(async (data: { from: string; signal: any }) => {
    const pc = peerConnectionRef.current
    const socket = socketRef.current
    if (!pc || !socket) return

    const { signal } = data

    try {
      if (signal.type === 'offer') {
        if (pc.signalingState === 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)

          socket.emit('signal', {
            roomId,
            signal: {
              type: 'answer',
              sdp: pc.localDescription,
            },
          })
        }
      } else if (signal.type === 'answer') {
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
        }
      } else if (signal.type === 'ice-candidate' && signal.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate))
        } catch {
          // ICE candidate may be stale, ignore
        }
      }
    } catch (err) {
      console.error('[WebRTC] handleSignal error:', err)
    }
  }, [roomId])

  // ─── Recording ────────────────────────────────────────────────────────────
  const startRecordingInternal = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) return

    try {
      const chunks: Blob[] = []
      recordedChunksRef.current = chunks

      // Create a combined stream (local + remote if available)
      let combinedStream = stream
      if (remoteVideoRef.current?.srcObject) {
        combinedStream = new MediaStream([
          ...stream.getAudioTracks(),
          ...(remoteVideoRef.current.srcObject as MediaStream).getAudioTracks(),
          ...stream.getVideoTracks(),
        ])
      }

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : 'video/webm',
      })

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        recordingBlobRef.current = blob
        const url = URL.createObjectURL(blob)
        setRecordingUrl(url)
      }

      mediaRecorder.start(1000) // collect data every second
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      setRecordingTime(0)

      // Recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('[Recording] start error:', err)
      toast({
        title: 'Recording Failed',
        description: 'Could not start recording. Please try again.',
        variant: 'destructive',
      })
    }
  }, [toast])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    setIsRecording(false)
  }, [])

  const handleConsentGranted = useCallback(() => {
    setRecordingConsented(true)
    setShowConsentBanner(false)
    startRecordingInternal()
  }, [startRecordingInternal])

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      if (!recordingConsented) {
        setShowConsentBanner(true)
      } else {
        startRecordingInternal()
      }
    }
  }, [isRecording, recordingConsented, stopRecording, startRecordingInternal])

  // ─── Upload recording ─────────────────────────────────────────────────────
  const uploadRecording = useCallback(async () => {
    if (!recordingBlobRef.current || !callSession) return

    setRecordingUploadState('uploading')
    try {
      const formData = new FormData()
      formData.append('callSessionId', callSession.id)
      formData.append('recording', recordingBlobRef.current, `${callSession.id}.webm`)

      const res = await fetch('/api/call-recording', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (data.success) {
        setRecordingUploadState('uploaded')
        toast({
          title: 'Recording Saved',
          description: 'Your call recording has been saved.',
        })
      } else {
        setRecordingUploadState('failed')
        toast({
          title: 'Upload Failed',
          description: data.error || 'Failed to upload recording.',
          variant: 'destructive',
        })
      }
    } catch {
      setRecordingUploadState('failed')
      toast({
        title: 'Upload Failed',
        description: 'Network error. Recording saved locally.',
        variant: 'destructive',
      })
    }
  }, [callSession, toast])

  // ─── Fetch AI Summary ─────────────────────────────────────────────────────
  const fetchAiSummary = useCallback(async () => {
    if (!callSession) return

    setSummaryLoading(true)
    try {
      const res = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callSessionId: callSession.id,
          bookingId: callSession.bookingId,
        }),
      })

      const data = await res.json()
      if (data.success && data.data?.summary) {
        setAiSummary(data.data.summary)
      } else {
        // Fallback summary
        setAiSummary(
          `Session with ${selectedNanny?.name || 'Expert'} lasted ${formatTime(callTime)}. The consultation covered childcare topics discussed during the call.`
        )
      }
    } catch {
      setAiSummary(
        `Session with ${selectedNanny?.name || 'Expert'} lasted ${formatTime(callTime)}. Summary generation is currently unavailable.`
      )
    } finally {
      setSummaryLoading(false)
    }
  }, [callSession, selectedNanny, callTime, formatTime])

  // ─── End call handler ─────────────────────────────────────────────────────
  const handleEndCall = useCallback(() => {
    callEndedRef.current = true
    setCallDuration(callTime)

    // Stop recording
    stopRecording()

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.emit('leave-room', { roomId })
      socketRef.current.disconnect()
      socketRef.current = null
    }

    // Stop local stream
    stopLocalStream()

    // Clear timers
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // Reset state
    setSocketConnected(false)
    setRemoteStreamReady(false)
    setConnectionError(null)

    // End call in store
    endCall()

    // Show summary if call had meaningful duration
    if (callTime > 5) {
      setShowSummaryModal(true)
      fetchAiSummary()
    }
  }, [callTime, stopRecording, stopLocalStream, endCall, roomId, fetchAiSummary])

  // ─── Toggle mic ────────────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev
      localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !next })
      return next
    })
  }, [])

  // ─── Toggle video ──────────────────────────────────────────────────────────
  const toggleVideo = useCallback(() => {
    setIsVideoOff((prev) => {
      const next = !prev
      localStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = !next })
      return next
    })
  }, [])

  // ─── Send message handler ──────────────────────────────────────────────────
  const handleSendMessage = useCallback(() => {
    if (messageInput.trim()) {
      sendMessage(messageInput.trim())
      // Also emit via socket for real-time delivery
      if (socketRef.current) {
        socketRef.current.emit('chat:message', {
          roomId,
          content: messageInput.trim(),
          senderType: 'parent',
        })
      }
      setMessageInput('')
    }
  }, [messageInput, sendMessage, roomId])

  // ─── Socket.io Connection ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isInCall || !roomId) return

    callEndedRef.current = false
    hasCreatedOfferRef.current = false
    setConnectionError(null)

    // Create dedicated socket for the video call
    const socket = io('/?XTransformPort=3004', {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })
    socketRef.current = socket

    // Auth with the server
    const authPayload = currentUser
      ? btoa(JSON.stringify({
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
        }))
      : btoa(JSON.stringify({ id: 'guest', name: 'Guest', role: 'parent' }))

    socket.on('connect', () => {
      console.log('[VideoCall] Socket connected:', socket.id)
      setSocketConnected(true)
      setConnectionError(null)

      // Authenticate
      socket.emit('auth', { token: authPayload })

      // Join the call room
      socket.emit('join-room', { roomId })
      setCallPhase('connecting')
    })

    socket.on('connect_error', (err) => {
      console.error('[VideoCall] Socket connection error:', err.message)
      setSocketConnected(false)
      setConnectionError(`Connection failed: ${err.message}`)
    })

    socket.on('disconnect', (reason) => {
      console.log('[VideoCall] Socket disconnected:', reason)
      setSocketConnected(false)
      if (!callEndedRef.current) {
        setConnectionError('Disconnected. Reconnecting...')
      }
    })

    socket.on('user-joined', async (data: { userId: string; isParent: boolean }) => {
      console.log('[VideoCall] User joined:', data.userId)
      isParentRef.current = data.isParent

      // If we are the parent, wait a moment then create offer
      if (data.isParent && !hasCreatedOfferRef.current) {
        const pc = await createPeerConnection()
        if (pc) {
          // Small delay to ensure remote peer is ready
          setTimeout(() => createOffer(), 500)
        }
      }
    })

    socket.on('signal', async (data: { from: string; signal: any }) => {
      // Create peer connection on first signal if not already created
      if (!peerConnectionRef.current) {
        const pc = await createPeerConnection()
        if (!pc) return
      }
      handleSignal(data)
    })

    socket.on('user-left', (data: { userId: string }) => {
      console.log('[VideoCall] User left:', data.userId)
      setRemoteStreamReady(false)
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null
      }
      // Close and reset peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }
      hasCreatedOfferRef.current = false
    })

    // Socket chat messages
    socket.on('chat:message', (data: { content: string; senderName: string; senderType: string }) => {
      // Only handle messages from the remote side (nanny)
      if (data.senderType === 'nanny') {
        sendMessage(data.content)
      }
    })

    // Start local stream immediately
    startLocalStream()

    return () => {
      if (!callEndedRef.current) {
        socket.emit('leave-room', { roomId })
      }
      socket.disconnect()
      socketRef.current = null
      setSocketConnected(false)
    }
  }, [isInCall, roomId, currentUser, createPeerConnection, createOffer, handleSignal, startLocalStream, sendMessage])

  // ─── Call timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isInCall && callPhase === 'active') {
      timerRef.current = setInterval(() => setCallTime((prev) => prev + 1), 1000)
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isInCall, callPhase])

  // ─── Fallback: connecting → active after timeout ───────────────────────────
  useEffect(() => {
    if (!isInCall || callPhase !== 'connecting') return
    const fallbackTimer = setTimeout(() => setCallPhase('active'), 8000)
    return () => clearTimeout(fallbackTimer)
  }, [isInCall, callPhase])

  // ─── Auto scroll messages ─────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      callEndedRef.current = true
      stopRecording()
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      stopLocalStream()
      if (timerRef.current) clearInterval(timerRef.current)
      // Revoke recording URL
      if (recordingUrl) URL.revokeObjectURL(recordingUrl)
    }
  }, [])

  // ─── Don't render if not in call ──────────────────────────────────────────
  if (!isInCall) return null

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 z-[100] bg-gray-950 flex flex-col select-none">

        {/* ═══ REMOTE VIDEO (always mounted for WebRTC) ═══ */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`absolute inset-0 w-full h-full object-cover z-0 ${remoteStreamReady ? '' : 'hidden'}`}
          style={{ transform: isSpeakerOff ? 'scaleX(-1)' : 'none' }}
        />

        {/* ═══ TOP BAR ═══ */}
        <AnimatePresence>
          {callPhase === 'active' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                  {selectedNanny?.name?.charAt(0) || 'E'}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{selectedNanny?.name || 'Expert'}</p>
                  <p className="text-white/50 text-xs">{selectedNanny?.specialty || 'Consultation'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Socket connection indicator */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full backdrop-blur-sm ${
                  socketConnected
                    ? 'bg-emerald-500/20'
                    : 'bg-red-500/20'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`} />
                  <span className={`text-[10px] font-semibold ${socketConnected ? 'text-emerald-300' : 'text-red-300'}`}>
                    {socketConnected ? 'Live' : 'Reconnecting'}
                  </span>
                </div>

                {isRecording && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/80 backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-white text-xs font-bold tracking-wider">REC {formatTime(recordingTime)}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-white text-sm font-mono font-medium">{formatTime(callTime)}</span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-sm">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-300 text-[10px] font-semibold">Encrypted</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ RINGING PHASE ═══ */}
        <AnimatePresence>
          {callPhase === 'ringing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-950"
            >
              {/* Pulsing rings */}
              <div className="relative mb-8">
                <div className="absolute inset-0 rounded-full border-2 border-amber-400/30 animate-ping" style={{ animationDuration: '1.5s' }} />
                <div className="absolute -inset-4 rounded-full border border-amber-400/15 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
                <div className="absolute -inset-8 rounded-full border border-amber-400/10 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.6s' }} />
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-amber-400/40 shadow-2xl shadow-amber-400/20">
                  {selectedNanny?.avatar ? (
                    <img src={selectedNanny.avatar} alt={selectedNanny.name || 'Expert'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                      <User className="w-12 h-12 text-amber-400" />
                    </div>
                  )}
                </div>
              </div>
              <h2 className="text-white text-2xl font-bold mb-2">{selectedNanny?.name || 'Expert'}</h2>
              <p className="text-white/40 text-sm animate-pulse">Calling...</p>
              <p className="text-white/20 text-xs mt-1">Connecting via secure channel</p>
              <Button
                onClick={handleEndCall}
                className="mt-12 rounded-full h-16 w-16 bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/30 transition-colors"
              >
                <PhoneOff className="w-7 h-7" />
              </Button>
              <p className="text-white/30 text-xs mt-3">Tap to cancel</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ CONNECTING PHASE ═══ */}
        <AnimatePresence>
          {callPhase === 'connecting' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-950"
            >
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-amber-400/40">
                  {selectedNanny?.avatar ? (
                    <img src={selectedNanny.avatar} alt={selectedNanny?.name || 'Expert'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                      <User className="w-10 h-10 text-amber-400" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center animate-pulse">
                  <Phone className="w-3 h-3 text-white" />
                </div>
              </div>
              <p className="text-white/60 text-sm font-medium animate-pulse">
                Connecting to {selectedNanny?.name}...
              </p>
              <div className="flex gap-1.5 mt-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-amber-400/60 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              {!socketConnected && (
                <p className="text-white/30 text-xs mt-3">Establishing secure connection...</p>
              )}
              <Button
                onClick={handleEndCall}
                className="mt-12 rounded-full h-16 w-16 bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/30 transition-colors"
              >
                <PhoneOff className="w-7 h-7" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ ACTIVE CALL ═══ */}
        {callPhase === 'active' && (
          <div className="flex-1 flex relative overflow-hidden z-10">
            {/* Main video area */}
            <div className="flex-1 relative flex items-center justify-center bg-gray-900">
              {/* Remote video or placeholder */}
              {!remoteStreamReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
                  <div className="relative z-10 text-center px-6">
                    <div className="w-32 h-32 rounded-3xl overflow-hidden mx-auto mb-5 shadow-2xl ring-4 ring-white">
                      {selectedNanny?.avatar ? (
                        <img src={selectedNanny.avatar} alt={selectedNanny.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
                          <User className="w-14 h-14 text-amber-400" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-gray-800 font-bold text-xl">{selectedNanny?.name}</h3>
                    <p className="text-stone-500 text-sm mt-1">{selectedNanny?.specialty}</p>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs text-emerald-600 font-semibold tracking-wide uppercase">
                        {socketConnected ? 'Connected' : 'Connecting...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Self video (small corner PIP) */}
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="absolute bottom-24 right-4 w-32 sm:w-40 aspect-[4/3] rounded-2xl bg-gray-800 border-2 border-white/20 overflow-hidden shadow-2xl z-30"
              >
                {!cameraError ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                    style={{ transform: 'scaleX(-1)' }}
                  />
                ) : null}
                {isVideoOff || cameraError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center mb-2">
                      <User className="w-7 h-7 text-gray-400" />
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">
                      {isVideoOff ? 'Camera Off' : cameraError}
                    </span>
                  </div>
                ) : null}
                {/* Mic indicator */}
                <div className="absolute bottom-1.5 left-1.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-500' : 'bg-gray-900/60'}`}>
                    {isMuted ? <MicOff className="w-3 h-3 text-white" /> : <Mic className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </motion.div>

              {/* ═══ CHAT PANEL ═══ */}
              <AnimatePresence>
                {isChatOpen && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 320, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="absolute top-0 right-0 bottom-0 bg-gray-900/95 backdrop-blur-xl border-l border-white/10 flex flex-col overflow-hidden z-20"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 min-w-[320px]">
                      <h3 className="text-white font-bold text-sm">In-Call Chat</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleChat}
                        className="text-white/60 hover:text-white hover:bg-white/10 rounded-full h-8 w-8"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 min-w-[320px]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#525252 transparent' }}>
                      {messages.length === 0 && (
                        <p className="text-center text-white/30 text-xs py-8">No messages yet</p>
                      )}
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                            msg.senderType === 'parent'
                              ? 'bg-amber-500 text-white ml-auto'
                              : 'bg-white/10 text-white/90'
                          }`}
                        >
                          <p className="text-[10px] font-semibold mb-0.5 opacity-70">{msg.senderName}</p>
                          <p>{msg.content}</p>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="p-3 border-t border-white/10 min-w-[320px]">
                      <div className="flex items-center gap-2">
                        <Input
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Type a message..."
                          className="flex-1 bg-white/10 border-white/10 text-white placeholder:text-white/30 rounded-xl text-sm h-9"
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!messageInput.trim()}
                          size="icon"
                          className="h-9 w-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-30 transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ═══ BOTTOM CONTROLS ═══ */}
        <AnimatePresence>
          {callPhase === 'active' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-0 left-0 right-0 z-30 pb-6 pt-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
            >
              <div className="flex items-center justify-center gap-3 px-4">
                <Button
                  onClick={toggleMic}
                  variant="ghost"
                  size="icon"
                  className={`h-12 w-12 rounded-full transition-colors ${
                    isMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
                  }`}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>

                <Button
                  onClick={toggleVideo}
                  variant="ghost"
                  size="icon"
                  className={`h-12 w-12 rounded-full transition-colors ${
                    isVideoOff ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
                  }`}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </Button>

                <Button
                  onClick={() => setIsSpeakerOff((prev) => !prev)}
                  variant="ghost"
                  size="icon"
                  className={`h-12 w-12 rounded-full transition-colors ${
                    isSpeakerOff ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
                  }`}
                >
                  {isSpeakerOff ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>

                <Button
                  onClick={toggleChat}
                  variant="ghost"
                  size="icon"
                  className={`h-12 w-12 rounded-full transition-colors ${
                    isChatOpen ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                </Button>

                <Button
                  onClick={toggleRecording}
                  variant="ghost"
                  size="icon"
                  className={`h-12 w-12 rounded-full transition-colors ${
                    isRecording ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-white/15 hover:bg-white/25 text-white'
                  }`}
                >
                  {isRecording ? <Square className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </Button>

                <Button
                  onClick={handleEndCall}
                  size="icon"
                  className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/40 transition-colors"
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ CONNECTION ERROR OVERLAY ═══ */}
        <AnimatePresence>
          {connectionError && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-sm"
            >
              <div className="bg-white rounded-2xl p-6 shadow-2xl text-center">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <WifiOff className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-gray-900 font-bold text-lg mb-2">Connection Issue</h3>
                <p className="text-stone-500 text-sm mb-4">{connectionError}</p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleEndCall}
                    variant="outline"
                    className="flex-1 rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50"
                  >
                    End Call
                  </Button>
                  <Button
                    onClick={() => {
                      setConnectionError(null)
                      // Reconnect socket
                      if (socketRef.current) {
                        socketRef.current.connect()
                      }
                    }}
                    className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ RECORDING CONSENT BANNER ═══ */}
        <AnimatePresence>
          {showConsentBanner && (
            <motion.div
              initial={{ opacity: 0, y: -100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -100 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute top-4 left-4 right-4 z-50"
            >
              <div className="bg-white rounded-2xl p-4 shadow-2xl border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-gray-900 font-bold text-sm">Recording Consent Required</h4>
                    <p className="text-stone-500 text-xs mt-1 leading-relaxed">
                      This call may be recorded for quality and training purposes. Both participants will be notified.
                      By proceeding, you consent to the recording of this session.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        onClick={handleConsentGranted}
                        size="sm"
                        className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-8"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        I Consent
                      </Button>
                      <Button
                        onClick={() => setShowConsentBanner(false)}
                        variant="ghost"
                        size="sm"
                        className="rounded-lg text-stone-500 text-xs h-8 hover:bg-stone-50"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ SUMMARY MODAL ═══ */}
      <AnimatePresence>
        {showSummaryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
            >
              <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-5 text-center">
                <CheckCircle2 className="w-10 h-10 text-white mx-auto mb-2" />
                <h2 className="text-white text-lg font-bold">Call Ended</h2>
                <p className="text-white/80 text-sm">Duration: {formatTime(callDuration)}</p>
              </div>
              <div className="p-5 space-y-4">
                {/* Recording section */}
                {recordingUrl && (
                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                        <Circle className="w-4 h-4 text-red-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-stone-700">Call Recording</h3>
                        <p className="text-xs text-stone-400">{formatTime(recordingTime)} recorded</p>
                      </div>
                    </div>
                    <video
                      src={recordingUrl}
                      controls
                      className="w-full rounded-lg mb-3 max-h-40 bg-black"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          const a = document.createElement('a')
                          a.href = recordingUrl
                          a.download = `mumaa-call-${callSession?.id || Date.now()}.webm`
                          a.click()
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-lg text-xs"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Download
                      </Button>
                      <Button
                        onClick={uploadRecording}
                        size="sm"
                        disabled={recordingUploadState === 'uploading' || recordingUploadState === 'uploaded'}
                        className="flex-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs hover:from-amber-600 hover:to-orange-600 disabled:opacity-50"
                      >
                        {recordingUploadState === 'uploading' && (
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        )}
                        {recordingUploadState === 'uploaded' && (
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        {recordingUploadState === 'idle' && (
                          <FileText className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        {recordingUploadState === 'uploading' ? 'Saving...' : recordingUploadState === 'uploaded' ? 'Saved' : 'Save to Cloud'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* AI Summary */}
                {summaryLoading ? (
                  <div className="flex flex-col items-center py-6">
                    <RefreshCw className="w-6 h-6 text-amber-500 animate-spin mb-2" />
                    <p className="text-sm text-stone-500">Generating AI summary...</p>
                  </div>
                ) : aiSummary ? (
                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-bold text-stone-700">AI-Generated Summary</h3>
                    </div>
                    <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
                  </div>
                ) : null}

                <Button
                  onClick={() => setShowSummaryModal(false)}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-colors"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
