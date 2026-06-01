// WebRTC utilities for managing peer connections
import Peer from 'peerjs';

export const createPeer = (peerId) => {
  return new Peer(peerId, {
    host: 'localhost',
    port: 9000,
    path: '/peerjs',
    secure: false,
  });
};

export const getLocalStream = async (constraints = { video: true, audio: true }) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (error) {
    console.error('Error accessing media devices:', error);
    
    // Provide user-friendly error messages
    if (error.name === 'NotAllowedError') {
      const message = 'Camera/microphone permission denied. Please enable camera and microphone access in your browser settings.';
      const enhancedError = new Error(message);
      enhancedError.name = 'PermissionDenied';
      throw enhancedError;
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      const message = 'No camera or microphone found. Please check your device connections.';
      const enhancedError = new Error(message);
      enhancedError.name = 'DeviceNotFound';
      throw enhancedError;
    } else if (error.name === 'NotReadableError' || error.name === 'SecurityError') {
      const message = 'Unable to access camera/microphone. Another application may be using them.';
      const enhancedError = new Error(message);
      enhancedError.name = 'DeviceInUse';
      throw enhancedError;
    }
    throw error;
  }
};

export const stopStream = (stream) => {
  if (stream) {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  }
};

export const handleConnectionError = (error) => {
  console.error('WebRTC Error:', error);
  
  // Return the detailed error message if available
  if (error.message) {
    return error.message;
  }
  
  // Fallback to error type checking
  if (error.type === 'peer-unavailable') {
    return 'Peer is not available';
  } else if (error.type === 'network') {
    return 'Network error occurred';
  }
  return 'Connection failed';
};

export const getConnectionStats = async (peerConnection) => {
  if (!peerConnection) return null;
  
  try {
    const stats = await peerConnection.getStats();
    const result = {
      video: { inbound: {}, outbound: {} },
      audio: { inbound: {}, outbound: {} },
    };

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp') {
        const mediaType = report.mediaType;
        result[mediaType].inbound = {
          bytesReceived: report.bytesReceived,
          packetsReceived: report.packetsReceived,
          packetsLost: report.packetsLost,
          jitter: report.jitter,
          timestamp: report.timestamp,
        };
      }
      if (report.type === 'outbound-rtp') {
        const mediaType = report.mediaType;
        result[mediaType].outbound = {
          bytesSent: report.bytesSent,
          packetsSent: report.packetsSent,
          timestamp: report.timestamp,
        };
      }
    });

    return result;
  } catch (error) {
    console.error('Error getting connection stats:', error);
    return null;
  }
};
