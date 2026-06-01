'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getLocalStream, stopStream, handleConnectionError } from '@/lib/webrtc';

export default function VideoCall({ bookingId, remoteRole }) {
  const { data: session } = useSession();
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [error, setError] = useState(null);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const callStartTimeRef = useRef(null);

  // Initialize WebRTC connection
  useEffect(() => {
    if (!session || !bookingId) return;

    const initializeCall = async () => {
      try {
        setConnectionStatus('connecting');
        setError(null);

        // Get local media stream
        const localStream = await getLocalStream({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });

        localStreamRef.current = localStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        // Create RTCPeerConnection
        const config = {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        };

        const peerConnection = new RTCPeerConnection(config);
        peerConnectionRef.current = peerConnection;

        // Add local stream tracks
        localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStream);
        });

        // Handle remote stream
        peerConnection.ontrack = (event) => {
          console.log('Remote track received:', event.track.kind);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
          console.log('Connection state:', peerConnection.connectionState);
          setConnectionStatus(peerConnection.connectionState);

          if (peerConnection.connectionState === 'connected' && !callStartTimeRef.current) {
            callStartTimeRef.current = Date.now();
          }

          if (
            peerConnection.connectionState === 'disconnected' ||
            peerConnection.connectionState === 'failed'
          ) {
            handleCallEnd();
          }
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = async (event) => {
          if (event.candidate) {
            try {
              await fetch('/api/webrtc/signaling', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'candidate',
                  bookingId,
                  candidate: event.candidate,
                }),
              });
            } catch (error) {
              console.error('Error sending ICE candidate:', error);
            }
          }
        };

        // Register peer in signaling server
        const registerResponse = await fetch('/api/webrtc/signaling', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register',
            bookingId,
            peerId: session.user.id,
          }),
        });

        const registerData = await registerResponse.json();
        console.log('Peer registered:', registerData);

        // Initiator (teacher) creates offer
        if (session.user.role === 'teacher') {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);

          const offerResponse = await fetch('/api/webrtc/signaling', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'offer',
              bookingId,
              offer: peerConnection.localDescription,
            }),
          });

          const offerData = await offerResponse.json();
          console.log('Offer sent:', offerData);
        } else {
          // Student waits and responds with answer
          let pollForOfferInterval = null;
          pollForOfferInterval = setInterval(async () => {
            try {
              const answerResponse = await fetch('/api/webrtc/signaling', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'answer',
                  bookingId,
                }),
              });

              const answerData = await answerResponse.json();

              if (answerData.offer) {
                clearInterval(pollForOfferInterval);

                await peerConnection.setRemoteDescription(
                  new RTCSessionDescription(answerData.offer)
                );

                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);

                await fetch('/api/webrtc/signaling', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'answer',
                    bookingId,
                    answer: peerConnection.localDescription,
                  }),
                });

                console.log('Answer sent');
              }
            } catch (error) {
              console.error('Error polling for offer:', error);
            }
          }, 1000);

          // Store interval ID for cleanup
          peerConnectionRef.current.pollForOfferInterval = pollForOfferInterval;
        }

        // Poll for ICE candidates
        let pollCandidatesInterval = setInterval(async () => {
          try {
            const candidateResponse = await fetch('/api/webrtc/signaling', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'get-candidates',
                bookingId,
              }),
            });

            const candidateData = await candidateResponse.json();

            if (candidateData.candidates && candidateData.candidates.length > 0) {
              for (const candidate of candidateData.candidates) {
                try {
                  await peerConnection.addIceCandidate(
                    new RTCIceCandidate(candidate)
                  );
                } catch (error) {
                  console.error('Error adding ICE candidate:', error);
                }
              }
            }
          } catch (error) {
            console.error('Error polling candidates:', error);
          }
        }, 500);

        // Store interval ID for cleanup
        peerConnectionRef.current.pollCandidatesInterval = pollCandidatesInterval;

        return () => {
          // Clear polling intervals
          if (pollCandidatesInterval) {
            clearInterval(pollCandidatesInterval);
          }
          if (peerConnectionRef.current?.pollForOfferInterval) {
            clearInterval(peerConnectionRef.current.pollForOfferInterval);
          }
        };
      } catch (err) {
        console.error('Error initializing call:', err);
        setError(handleConnectionError(err));
        setConnectionStatus('failed');
      }
    };

    initializeCall();

    return () => {
      // Comprehensive cleanup on component unmount or dependency change
      try {
        // Stop all tracks in local stream
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => {
            track.stop();
          });
        }

        // Close peer connection
        if (peerConnectionRef.current) {
          peerConnectionRef.current.getSenders().forEach((sender) => {
            try {
              sender.track?.stop();
            } catch (err) {
              console.error('Error stopping sender track:', err);
            }
          });
          peerConnectionRef.current.close();
        }

        // Clear video elements
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
      } catch (err) {
        console.error('Error during cleanup:', err);
      }
    };
  }, [session, bookingId]);

  // Timer for call duration
  useEffect(() => {
    if (connectionStatus !== 'connected') return;

    const timer = setInterval(() => {
      if (callStartTimeRef.current) {
        const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        setCallDuration(duration);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [connectionStatus]);

  const handleToggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const handleToggleCamera = async () => {
    if (!localStreamRef.current) return;

    const videoTracks = localStreamRef.current.getVideoTracks();

    if (!isCameraOff) {
      // Turn off camera - stop the video tracks completely
      videoTracks.forEach((track) => {
        track.stop();
      });
      setIsCameraOff(true);
    } else {
      // Turn on camera - need to request new camera stream
      try {
        const newStream = await getLocalStream({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false, // Don't request audio again, we already have it
        });

        // Replace video tracks in peer connection
        if (peerConnectionRef.current) {
          const videoTracks = newStream.getVideoTracks();
          if (videoTracks.length > 0) {
            const sender = peerConnectionRef.current
              .getSenders()
              .find((s) => s.track?.kind === 'video');
            
            if (sender) {
              await sender.replaceTrack(videoTracks[0]);
            } else {
              // If no sender exists, add the track
              peerConnectionRef.current.addTrack(videoTracks[0], localStreamRef.current);
            }
          }
        }

        // Update local stream with new video track
        localStreamRef.current.getVideoTracks().forEach((track) => track.stop());
        newStream.getVideoTracks().forEach((track) => {
          localStreamRef.current.addTrack(track);
        });

        setIsCameraOff(false);
      } catch (err) {
        console.error('Error turning on camera:', err);
        setError('Failed to turn on camera. Please check your permissions.');
      }
    }
  };

  const handleCallEnd = async () => {
    try {
      // Notify backend
      await fetch('/api/webrtc/signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end-call',
          bookingId,
        }),
      });
    } catch (error) {
      console.error('Error ending call:', error);
    }

    // Stop all media tracks completely
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      localStreamRef.current = null;
    }

    // Close peer connection and all senders
    if (peerConnectionRef.current) {
      peerConnectionRef.current.getSenders().forEach((sender) => {
        try {
          sender.track?.stop();
        } catch (err) {
          console.error('Error stopping sender track:', err);
        }
      });
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Reset state
    setConnectionStatus('disconnected');
    setIsMuted(false);
    setIsCameraOff(false);
    setCallDuration(0);
    setError(null);
  };

  const handleRetry = () => {
    setError(null);
    setConnectionStatus('disconnected');
    // Re-trigger the initialization by forcing a re-run of the useEffect
    // This will happen automatically on the next render cycle
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-800 mb-1">Connection Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={handleRetry}
              className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium whitespace-nowrap"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      {/* Video Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black min-h-96">
        {/* Local Video */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            You
          </div>
          {isCameraOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <span className="text-white text-center">📷 Camera Off</span>
            </div>
          )}
        </div>

        {/* Remote Video */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            {remoteRole === 'teacher' ? 'Teacher' : 'Student'}
          </div>
          {connectionStatus !== 'connected' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
              <div className="text-center text-white">
                <p className="text-lg font-semibold mb-2">
                  {connectionStatus === 'connecting' ? '🔄 Connecting...' : '❌ Disconnected'}
                </p>
                <p className="text-sm">{connectionStatus}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status and Controls */}
      <div className="bg-white border-t border-gray-200">
        {/* Status Bar */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className={`inline-block w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`}></span>
            <span className="text-sm font-medium text-gray-700">
              Status: <span className="capitalize">{connectionStatus}</span>
            </span>
            {connectionStatus === 'connected' && (
              <span className="text-sm font-medium text-gray-700">
                Duration: {formatDuration(callDuration)}
              </span>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="px-4 py-4 flex justify-center gap-4">
          <button
            onClick={handleToggleMute}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isMuted
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isMuted ? '🔇' : '🔊'} {isMuted ? 'Unmute' : 'Mute'}
          </button>

          <button
            onClick={handleToggleCamera}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isCameraOff
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isCameraOff ? '📷' : '🎥'} {isCameraOff ? 'Camera Off' : 'Camera On'}
          </button>

          <button
            onClick={handleCallEnd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            📞 End Call
          </button>
        </div>

        {/* Info Text */}
        <div className="px-4 py-3 text-center text-sm text-gray-600 bg-gray-50">
          {connectionStatus === 'connecting'
            ? 'Waiting for the other person to join...'
            : connectionStatus === 'connected'
              ? 'Video call is active'
              : 'Connection lost. Please try again.'}
        </div>
      </div>
    </div>
  );
}
