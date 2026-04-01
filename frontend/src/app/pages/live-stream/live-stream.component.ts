import { Component, ElementRef, OnInit, ViewChild, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-live-stream',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './live-stream.component.html',
  styleUrls: ['./live-stream.component.scss']
})
export class LiveStreamComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  swPush = inject(SwPush);
  http = inject(HttpClient);
  router = inject(Router);
  route = inject(ActivatedRoute);

  isAdmin = false;
  status = 'Disconnected';
  streamUrl = '';
  isBroadcasting = false;
  isVideoMuted = false;
  isAudioMuted = false;
  isRemoteMuted = true; // Default to muted for autoplay support

  // New Chat and Participant State
  chatMessages: { user: string, text: string, isEncrypted?: boolean, timestamp: Date }[] = [];
  newMessage = '';
  userData: any = null;
  remoteStreams: { [socketId: string]: MediaStream } = {};

  mediaStream: MediaStream | null = null;
  courseId: string | null = null;

  Object = Object; // Expose Object to template
  socket!: Socket;
  encryptionKey: CryptoKey | null = null;
  salt = new TextEncoder().encode('lms-antigravity-salt'); // Static salt for demo consistency
  peerConnections: { [socketId: string]: RTCPeerConnection } = {};
  pendingCandidates: { [socketId: string]: RTCIceCandidateInit[] } = {};
  readonly rtcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

  // Replace with the VAPID Public Key generated on the backend
  readonly VAPID_PUBLIC_KEY = "BDX7GdseSgWzglE11hFGadhq-1rsxeHuYvHTliS_cEoyCB6Te-OJz4aSxcsu1q-8V0KBFHILAdKIr1WxZ1HPrZY";

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      this.courseId = params.get('courseId');
      console.log('Active Course ID for Live Stream:', this.courseId);
    });

    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      this.userData = JSON.parse(userStr);
      this.isAdmin = this.userData.role === 'Admin';
    }

    this.initializeEncryption().then(() => {
      this.connectToStream();
    });
  }

  async initializeEncryption() {
    const secret = this.courseId || 'general_lms_room';
    try {
      this.encryptionKey = await this.deriveKey(secret);
      console.log('E2EE Encryption Initialized for room:', secret);
    } catch (err) {
      console.error('Failed to initialize E2EE:', err);
    }
  }

  ngOnDestroy() {
    this.stopBroadcast();
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  connectToStream() {
    this.status = 'Connecting to Socket.io signaling server...';

    // Connect socket
    const socketUrl = environment.apiUrl.replace('/api', '');
    this.socket = io(socketUrl);

    this.socket.on('connect', () => {
      this.status = 'Connected to Signaling Server';
      const roomId = this.courseId || 'general_lms_room';
      this.socket.emit('join-room', roomId);
    });

    // Listen for Chat messages
    this.socket.on('receive-chat-message', async (msg: any) => {
      try {
        if (msg.isEncrypted) {
          console.log('[E2EE Debug] Locked payload received from server:', msg.text);
        }
        if (this.encryptionKey && msg.isEncrypted) {
          msg.text = await this.decryptMessage(msg.text);
          console.log('[E2EE Debug] Message decrypted successfully');
        }
        this.chatMessages.push(msg);
      } catch (err) {
        console.error('Failed to decrypt message:', err);
        msg.text = '[Encrypted Message - Key Mismatch]';
        this.chatMessages.push(msg);
      }
    });

    // Listen for session end
    this.socket.on('session-ended', () => {
      alert('The session has been ended by the Admin. Navigating back to dashboard...');
      this.router.navigate(['/dashboard']);
    });

    // When the Admin goes live, tell existing students to re-request an offer
    this.socket.on('broadcaster-ready', () => {
      if (!this.isAdmin) {
        const roomId = this.courseId || 'general_lms_room';
        this.socket.emit('join-room', roomId);
      }
    });

    // --- SIGNALING HANDLERS ---

    // When a Student joins the room, Admin creates an Offer for them
    this.socket.on('user-connected', async (userId: string) => {
      if (!this.isAdmin || !this.mediaStream) return;
      console.log('Student connected:', userId);

      const peerConnection = new RTCPeerConnection(this.rtcConfig);
      this.peerConnections[userId] = peerConnection;

      // Add local broadcast tracks to the peer connection
      this.mediaStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.mediaStream!);
      });

      // Trickle ICE
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('ice-candidate', {
            target: userId,
            sender: this.socket.id,
            candidate: event.candidate
          });
        }
      };

      // Create and send SDP Offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      this.socket.emit('offer', { target: userId, caller: this.socket.id, sdp: peerConnection.localDescription });
    });

    // When Student receives an Offer from the Admin
    this.socket.on('offer', async (payload: any) => {
      if (this.isAdmin) return; // Admin only broadcasts
      console.log('Received Broadcast offer from Admin:', payload.caller);

      const peerConnection = new RTCPeerConnection(this.rtcConfig);
      this.peerConnections[payload.caller] = peerConnection;

      // When the student receives the track, attach it to the remote <video> tag
      peerConnection.ontrack = (event) => {
        console.log('Received remote track for index:', payload.caller, event.streams[0]);
        if (!this.isAdmin && this.remoteVideo) {
          this.remoteVideo.nativeElement.srcObject = event.streams[0];
          this.status = 'Receiving Live Broadcast...';
          this.streamUrl = 'Handshake Complete - Streaming Active';
        } else if (this.isAdmin) {
          // If Admin, add student stream to grid
          this.remoteStreams[payload.caller] = event.streams[0];
        }
      };

      // Trickle ICE back to Admin
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('ice-candidate', {
            target: payload.caller,
            sender: this.socket.id,
            candidate: event.candidate
          });
        }
      };

      // Accept Offer, Generate Answer, Send Back
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));

        // Process any candidates that arrived before the description was set
        const queue = this.pendingCandidates[payload.caller] || [];
        while (queue.length > 0) {
          const candidate = queue.shift();
          if (candidate) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }
        delete this.pendingCandidates[payload.caller];

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        this.socket.emit('answer', { target: payload.caller, caller: this.socket.id, sdp: peerConnection.localDescription });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    });

    // When Admin receives the Answer from the Student
    this.socket.on('answer', async (payload: any) => {
      const peerConnection = this.peerConnections[payload.caller];
      if (peerConnection) {
        console.log('Received Answer from Student:', payload.caller);
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));

          // Process any candidates that arrived before the description was set
          const queue = this.pendingCandidates[payload.caller] || [];
          while (queue.length > 0) {
            const candidate = queue.shift();
            if (candidate) {
              await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
          }
          delete this.pendingCandidates[payload.caller];
        } catch (err) {
          console.error('Error setting remote description for student:', err);
        }
      }
    });

    // Handle incoming ICE candidates for both
    this.socket.on('ice-candidate', async (incoming: any) => {
      const peerId = incoming.sender;
      const peerConnection = this.peerConnections[peerId];

      if (peerConnection && peerConnection.remoteDescription) {
        console.log('Adding ICE candidate from:', peerId);
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(incoming.candidate));
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      } else {
        console.warn('Queuing ICE candidate (peer not ready):', peerId);
        if (!this.pendingCandidates[peerId]) {
          this.pendingCandidates[peerId] = [];
        }
        this.pendingCandidates[peerId].push(incoming.candidate);
      }
    });
  }

  manualJoin() {
    console.log('Manually re-joining room:', this.courseId);
    if (this.socket) {
      const roomId = this.courseId || 'general_lms_room';
      this.socket.emit('join-room', roomId);
      this.status = 'Attempting Re-sync...';
    }
  }

  private findPeerConnectionKey(): string | undefined {
    return Object.keys(this.peerConnections)[0];
  }

  startBroadcast() {
    this.status = 'Broadcasting...';
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        this.mediaStream = stream;
        this.isBroadcasting = true;
        this.isVideoMuted = false;
        this.isAudioMuted = false;

        if (this.localVideo) {
          this.localVideo.nativeElement.srcObject = stream;
        }
        this.status = 'You are now LIVE (Local Preview)';

        // Tell everyone who was already waiting in the room to request an offer
        this.socket.emit('broadcaster-ready', this.courseId || 'general_lms_room');

        // Notify students via email automatically
        const payload = this.courseId ? { courseId: this.courseId } : {};
        this.http.post(`${environment.apiUrl}/live/notify-students`, payload, {
          headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
        }).subscribe({
          next: () => console.log('Successfully dispatched live notification emails to all students.'),
          error: (err) => console.error('Failed to dispatch notification emails.', err)
        });
      })
      .catch(err => {
        console.error('Failed to get media devices', err);
        this.status = 'Error accessing camera/mic';
      });
  }

  stopBroadcast() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.localVideo) {
      this.localVideo.nativeElement.srcObject = null;
    }

    // Tear down RTCPeerConnections
    Object.keys(this.peerConnections).forEach(key => {
      this.peerConnections[key].close();
      delete this.peerConnections[key];
    });

    if (this.isAdmin && this.isBroadcasting) {
      const roomId = this.courseId || 'general_lms_room';
      this.socket.emit('end-session', roomId);
    }

    this.isBroadcasting = false;
    this.status = 'Broadcast Ended';

    // Auto-navigate to dashboard after stopping
    this.router.navigate(['/dashboard']);
  }

  async sendMessage() {
    if (!this.newMessage.trim()) return;
    const roomId = this.courseId || 'general_lms_room';

    let messageToSend = this.newMessage;
    let isEncrypted = false;

    if (this.encryptionKey) {
      try {
        messageToSend = await this.encryptMessage(this.newMessage);
        isEncrypted = true;
        console.log('[E2EE Debug] Plain text encrypted as:', messageToSend);
      } catch (err) {
        console.error('Encryption failed, sending plain text safely?', err);
      }
    }

    this.socket.emit('send-chat-message', {
      roomId,
      message: messageToSend,
      isEncrypted,
      userName: this.isAdmin ? 'Instructor (Admin)' : (this.userData?.name || 'Student')
    });
    this.newMessage = '';
  }

  // --- CRYPTOGRAPHIC HELPERS ---

  private async deriveKey(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: this.salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private async encryptMessage(text: string): Promise<string> {
    if (!this.encryptionKey) return text;
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      encoder.encode(text)
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    return btoa(String.fromCharCode(...combined));
  }

  private async decryptMessage(encryptedBase64: string): Promise<string> {
    if (!this.encryptionKey) return '[Decryption Error: No Key]';
    const combined = new Uint8Array(atob(encryptedBase64).split('').map(c => c.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      data
    );

    return new TextDecoder().decode(decrypted);
  }

  // Allow students to join the conversation
  joinConversation() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        this.mediaStream = stream;
        if (this.localVideo) {
          this.localVideo.nativeElement.srcObject = stream;
        }

        // Add tracks to existing peer connections (Admin)
        Object.values(this.peerConnections).forEach(pc => {
          stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
          });
          // Re-negotiate
          pc.createOffer().then(offer => {
            pc.setLocalDescription(offer);
            const target = Object.keys(this.peerConnections).find(key => this.peerConnections[key] === pc);
            this.socket.emit('offer', { target, caller: this.socket.id, sdp: pc.localDescription });
          });
        });

        alert('You have joined the conversation! Other participants can now see/hear you.');
      })
      .catch(err => console.error('Failed to get user media for student', err));
  }

  toggleVideo() {
    if (this.mediaStream) {
      this.isVideoMuted = !this.isVideoMuted;
      this.mediaStream.getVideoTracks().forEach(track => {
        track.enabled = !this.isVideoMuted;
      });
    }
  }

  toggleAudio() {
    if (this.mediaStream) {
      this.isAudioMuted = !this.isAudioMuted;
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = !this.isAudioMuted;
      });
    }
  }

  toggleRemoteMute() {
    this.isRemoteMuted = !this.isRemoteMuted;
    if (this.remoteVideo) {
      this.remoteVideo.nativeElement.muted = this.isRemoteMuted;
    }
  }

  requestNotificationPermission() {
    if (this.swPush.isEnabled) {
      this.swPush.requestSubscription({
        serverPublicKey: this.VAPID_PUBLIC_KEY
      })
        .then(sub => {
          this.http.post(`${environment.apiUrl}/notifications/subscribe`, sub).subscribe({
            next: () => alert('Successfully subscribed to upcoming session notifications!'),
            error: (err) => console.error('Subscription failed on backend', err)
          });
        })
        .catch(err => {
          console.error('Could not subscribe to notifications', err);
          alert('Subscription failed. See console.');
        });
    } else {
      alert('Push notifications not enabled/supported in this environment. (ServiceWorkers require HTTPS or localhost)');
    }
  }

  exitSession() {
    if (this.isBroadcasting) {
      if (confirm('Are you sure you want to end this live session for everyone?')) {
        this.stopBroadcast();
        this.router.navigate(['/admin']);
      }
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
