import { io } from 'socket.io-client';
import { Peer } from 'peerjs';

// DOM Elements
const lobby = document.getElementById('lobby');
const mainConference = document.getElementById('main-conference');
const joinBtn = document.getElementById('join-btn');
const usernameInput = document.getElementById('username');
const roomIdInput = document.getElementById('room-id');
const videoGrid = document.getElementById('video-grid');
const localVideo = document.getElementById('local-video');
const micToggle = document.getElementById('mic-toggle');
const camToggle = document.getElementById('cam-toggle');
const screenShareBtn = document.getElementById('screen-share-btn');
const leaveBtn = document.getElementById('leave-btn');
const chatInput = document.getElementById('chat-message');
const sendMsgBtn = document.getElementById('send-msg-btn');
const messagesList = document.getElementById('messages');
const whiteboardToggle = document.getElementById('whiteboard-toggle');
const whiteboardModal = document.getElementById('whiteboard-container');
const closeWhiteboardBtn = document.getElementById('close-whiteboard-btn');
const canvas = document.getElementById('whiteboard-canvas');
const ctx = canvas.getContext('2d');
const fileInput = document.getElementById('file-input');
const filesList = document.getElementById('files-list');
const handRaiseBtn = document.getElementById('hand-raise-btn');
const copyRoomBtn = document.getElementById('copy-room-btn');
const inviteBtn = document.getElementById('invite-btn');
const avatarPreview = document.getElementById('avatar-preview');
const participantList = document.getElementById('participant-list');

// State
let socket;
let myPeer;
let myStream;
let myName = 'Anonymous';
let myAvatar = '';
let myPeerId = '';
let currentRoomId = '';
let isHost = false;
let roomHostId = '';
let allUsers = {};
const peers = {};
let drawing = false;
let color = '#6366f1';
let size = 5;
let isHandRaised = false;

// Initialization
function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) roomIdInput.value = roomParam;

    updateAvatar();
    setupWhiteboard();
    setupEventListeners();
}

function updateAvatar() {
    const name = usernameInput.value || 'Nexus';
    myAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`;
    avatarPreview.src = myAvatar;
}

function setupEventListeners() {
    usernameInput.addEventListener('input', updateAvatar);
    joinBtn.addEventListener('click', joinRoom);
    micToggle.addEventListener('click', toggleMic);
    camToggle.addEventListener('click', toggleCam);
    screenShareBtn.addEventListener('click', toggleScreenShare);
    handRaiseBtn.addEventListener('click', toggleHandRaise);
    copyRoomBtn.addEventListener('click', copyRoomId);
    inviteBtn.addEventListener('click', shareInvite);
    leaveBtn.addEventListener('click', () => window.location.reload());
    sendMsgBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => e.key === 'Enter' && sendMessage());
    whiteboardToggle.addEventListener('click', () => whiteboardModal.classList.toggle('active'));
    closeWhiteboardBtn.addEventListener('click', () => whiteboardModal.classList.remove('active'));
    fileInput.addEventListener('change', handleFileUpload);
    
    document.querySelectorAll('.emoji-item').forEach(btn => {
        btn.addEventListener('click', () => sendReaction(btn.innerText));
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
        });
    });
}

async function joinRoom() {
    myName = usernameInput.value || 'User_' + Math.floor(Math.random() * 1000);
    currentRoomId = roomIdInput.value || 'lobby-101';
    
    try {
        myStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        addVideoStream(localVideo, myStream, 'local');
        startAudioAnalysis(myStream, 'local');
        
        lobby.classList.remove('active');
        mainConference.classList.add('active');
        document.getElementById('display-room-id').innerText = `Room: ${currentRoomId}`;
        window.history.pushState({}, '', `?room=${currentRoomId}`);

        setupNetwork();
    } catch (err) {
        console.error('Failed to get local stream', err);
        alert('Could not access camera/microphone. Please check permissions.');
    }
}

function setupNetwork() {
    socket = io('/');
    myPeer = new Peer(undefined, {
        host: '/',
        port: window.location.port || (window.location.protocol === 'https:' ? 443 : 80),
        path: '/peerjs'
    });

    myPeer.on('open', id => {
        myPeerId = id;
        socket.emit('join-room', currentRoomId, id, { name: myName, avatar: myAvatar });
    });

    myPeer.on('call', call => {
        call.answer(myStream);
        const video = document.createElement('video');
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream, call.peer);
            startAudioAnalysis(userVideoStream, call.peer);
        });
    });

    socket.on('room-info', ({ host, users }) => {
        roomHostId = host;
        isHost = myPeerId === host;
        allUsers = users;
        updateParticipantList();
    });

    socket.on('new-host', hostId => {
        roomHostId = hostId;
        isHost = myPeerId === hostId;
        updateParticipantList();
        displayMessage('System', `${allUsers[hostId]?.name || 'Someone'} is now the host.`);
    });

    socket.on('user-connected', (userId, userData) => {
        allUsers[userId] = userData;
        connectToNewUser(userId, myStream);
        updateParticipantList();
        displayMessage('System', `${userData.name} joined the room.`);
    });

    socket.on('user-disconnected', userId => {
        if (peers[userId]) peers[userId].close();
        const wrapper = document.querySelector(`[data-user-id="${userId}"]`);
        if (wrapper) wrapper.remove();
        delete allUsers[userId];
        updateParticipantList();
    });

    socket.on('remote-mute', (mute) => {
        const audioTrack = myStream.getAudioTracks()[0];
        audioTrack.enabled = !mute;
        micToggle.classList.toggle('active', mute);
        micToggle.innerHTML = mute ? '<i data-lucide="mic-off"></i>' : '<i data-lucide="mic"></i>';
        lucide.createIcons();
        displayMessage('System', mute ? 'The host has muted you.' : 'The host has unmuted you.');
    });

    socket.on('kicked', () => {
        alert('You have been kicked from the room by the host.');
        window.location.reload();
    });

    socket.on('create-message', (message, userName, avatar) => {
        displayMessage(userName, message, avatar);
    });

    socket.on('draw', (data) => {
        drawOnCanvas(data.x0, data.y0, data.x1, data.y1, data.color, data.size, false);
    });

    socket.on('clear-whiteboard', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    socket.on('file-share', (fileData) => {
        addFileToList(fileData);
    });

    socket.on('hand-raise', (userId, raised) => {
        const wrapper = document.querySelector(`[data-user-id="${userId}"]`);
        if (wrapper) wrapper.classList.toggle('hand-raised', raised);
    });

    socket.on('reaction', (userId, emoji) => {
        showReaction(userId, emoji);
    });
}

function updateParticipantList() {
    participantList.innerHTML = '';
    Object.keys(allUsers).forEach(userId => {
        const user = allUsers[userId];
        const isMe = userId === myPeerId;
        const isUserHost = userId === roomHostId;
        
        const item = document.createElement('div');
        item.className = 'participant-item';
        item.innerHTML = `
            <img src="${user.avatar}" class="participant-avatar">
            <div class="participant-info">
                <div class="participant-name">${user.name} ${isMe ? '(You)' : ''}</div>
                <div class="participant-status">${isUserHost ? 'Host' : 'Participant'}</div>
            </div>
            <div class="participant-controls">
                ${isHost && !isMe ? `
                    <button class="control-btn" onclick="window.nexusRemoteMute('${userId}', true)" title="Mute">
                        <i data-lucide="mic-off"></i>
                    </button>
                    <button class="control-btn" onclick="window.nexusRemoteMute('${userId}', false)" title="Unmute">
                        <i data-lucide="mic"></i>
                    </button>
                    <button class="control-btn muted" onclick="window.nexusKickUser('${userId}')" title="Kick User">
                        <i data-lucide="user-x"></i>
                    </button>
                ` : ''}
            </div>
        `;
        participantList.appendChild(item);
    });
    lucide.createIcons();
}

window.nexusRemoteMute = (userId, mute) => {
    socket.emit('mute-user', userId, mute);
};

window.nexusKickUser = (userId) => {
    if (confirm('Are you sure you want to kick this user?')) {
        socket.emit('kick-user', userId);
    }
};

function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream, userId);
        startAudioAnalysis(userVideoStream, userId);
    });
    call.on('close', () => {
        const wrapper = document.querySelector(`[data-user-id="${userId}"]`);
        if (wrapper) wrapper.remove();
    });
    peers[userId] = call;
}

function addVideoStream(video, stream, userId) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    
    let wrapper;
    if (userId === 'local') {
        wrapper = document.getElementById('local-video-wrapper');
        wrapper.setAttribute('data-user-id', myPeerId || 'local');
    } else {
        wrapper = document.createElement('div');
        wrapper.className = 'video-wrapper';
        wrapper.setAttribute('data-user-id', userId);
        wrapper.appendChild(video);
        const label = document.createElement('div');
        label.className = 'video-label';
        const userName = allUsers[userId]?.name || 'Guest';
        label.innerText = userName;
        wrapper.appendChild(label);
        videoGrid.append(wrapper);
    }
}

// Enhancements Logic
function toggleHandRaise() {
    isHandRaised = !isHandRaised;
    handRaiseBtn.classList.toggle('active', isHandRaised);
    const myWrapper = document.querySelector(`[data-user-id="${myPeerId || 'local'}"]`);
    if (myWrapper) myWrapper.classList.toggle('hand-raised', isHandRaised);
    socket.emit('hand-raise', myPeerId, isHandRaised);
}

function sendReaction(emoji) {
    showReaction(myPeerId || 'local', emoji);
    socket.emit('reaction', myPeerId, emoji);
}

function showReaction(userId, emoji) {
    const wrapper = document.querySelector(`[data-user-id="${userId}"]`) || document.getElementById('local-video-wrapper');
    if (!wrapper) return;

    const el = document.createElement('div');
    el.className = 'floating-emoji';
    el.innerText = emoji;
    el.style.left = `${Math.random() * 60 + 20}%`;
    wrapper.appendChild(el);
    setTimeout(() => el.remove(), 2000);
}

function startAudioAnalysis(stream, userId) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const average = sum / bufferLength;

        const wrapper = document.querySelector(`[data-user-id="${userId}"]`) || (userId === 'local' ? document.getElementById('local-video-wrapper') : null);
        if (wrapper) {
            wrapper.classList.toggle('active-speaker', average > 30);
        }
        requestAnimationFrame(checkAudio);
    };
    checkAudio();
}

function shareInvite() {
    const inviteLink = window.location.href;
    navigator.clipboard.writeText(inviteLink);
    displayMessage('System', 'Invite link copied to clipboard!');
    const icon = inviteBtn.querySelector('i');
    inviteBtn.innerHTML = '<i data-lucide="check"></i>';
    lucide.createIcons();
    setTimeout(() => {
        inviteBtn.innerHTML = '<i data-lucide="user-plus"></i>';
        lucide.createIcons();
    }, 2000);
}

function copyRoomId() {
    navigator.clipboard.writeText(currentRoomId);
    const icon = copyRoomBtn.querySelector('i');
    copyRoomBtn.innerHTML = '<i data-lucide="check"></i>';
    lucide.createIcons();
    setTimeout(() => {
        copyRoomBtn.innerHTML = '<i data-lucide="copy"></i>';
        lucide.createIcons();
    }, 2000);
}

// Media Toggles
function toggleMic() {
    const enabled = myStream.getAudioTracks()[0].enabled;
    myStream.getAudioTracks()[0].enabled = !enabled;
    micToggle.classList.toggle('active', !enabled);
    micToggle.innerHTML = enabled ? '<i data-lucide="mic-off"></i>' : '<i data-lucide="mic"></i>';
    lucide.createIcons();
}

function toggleCam() {
    const enabled = myStream.getVideoTracks()[0].enabled;
    myStream.getVideoTracks()[0].enabled = !enabled;
    camToggle.classList.toggle('active', !enabled);
    camToggle.innerHTML = enabled ? '<i data-lucide="video-off"></i>' : '<i data-lucide="video"></i>';
    lucide.createIcons();
}

async function toggleScreenShare() {
    try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const videoTrack = screenStream.getVideoTracks()[0];
        
        Object.values(myPeer.connections).forEach(connection => {
            const videoSender = connection[0].peerConnection.getSenders().find(s => s.track.kind === 'video');
            videoSender.replaceTrack(videoTrack);
        });

        localVideo.srcObject = screenStream;

        videoTrack.onended = () => {
            const originalVideoTrack = myStream.getVideoTracks()[0];
            Object.values(myPeer.connections).forEach(connection => {
                const videoSender = connection[0].peerConnection.getSenders().find(s => s.track.kind === 'video');
                videoSender.replaceTrack(originalVideoTrack);
            });
            localVideo.srcObject = myStream;
        };
    } catch (err) {
        console.error('Error sharing screen:', err);
    }
}

// Chat
function sendMessage() {
    const message = chatInput.value;
    if (message.trim()) {
        socket.emit('send-message', message, myName);
        chatInput.value = '';
    }
}

function displayMessage(userName, message, avatar = '') {
    const msgDiv = document.createElement('div');
    const isSystem = userName === 'System';
    msgDiv.className = `message ${userName === myName ? 'mine' : ''} ${isSystem ? 'system-msg' : ''}`;
    
    if (isSystem) {
        msgDiv.style.alignSelf = 'center';
        msgDiv.style.background = 'rgba(255,255,255,0.05)';
        msgDiv.style.fontSize = '0.8rem';
        msgDiv.innerHTML = `<div class="message-text">${message}</div>`;
    } else {
        msgDiv.innerHTML = `
            <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.25rem">
                ${avatar ? `<img src="${avatar}" style="width:20px; height:20px; border-radius:50%">` : ''}
                <div class="message-user">${userName}</div>
            </div>
            <div class="message-text">${message}</div>
        `;
    }
    messagesList.appendChild(msgDiv);
    messagesList.scrollTop = messagesList.scrollHeight;
}

// Whiteboard
function setupWhiteboard() {
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.7;
    
    canvas.addEventListener('mousedown', (e) => { drawing = true; lastPos = getMousePos(e); });
    canvas.addEventListener('mousemove', (e) => {
        if (!drawing) return;
        const currentPos = getMousePos(e);
        drawOnCanvas(lastPos.x, lastPos.y, currentPos.x, currentPos.y, color, size, true);
        lastPos = currentPos;
    });
    canvas.addEventListener('mouseup', () => drawing = false);
    
    document.getElementById('whiteboard-color').addEventListener('input', (e) => color = e.target.value);
    document.getElementById('whiteboard-size').addEventListener('input', (e) => size = e.target.value);
    document.getElementById('clear-whiteboard-btn').addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        socket.emit('clear-whiteboard');
    });
}

let lastPos = { x: 0, y: 0 };
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function drawOnCanvas(x0, y0, x1, y1, strokeColor, strokeSize, emit) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeSize;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.closePath();

    if (emit) {
        socket.emit('draw', { x0, y0, x1, y1, color: strokeColor, size: strokeSize });
    }
}

// File Sharing
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const fileData = {
            name: file.name,
            type: file.type,
            size: file.size,
            data: event.target.result,
            sender: myName
        };
        socket.emit('file-share', fileData);
        addFileToList(fileData);
    };
    reader.readAsDataURL(file);
}

function addFileToList(fileData) {
    const fileDiv = document.createElement('div');
    fileDiv.className = 'file-item glass';
    fileDiv.style.padding = '0.75rem';
    fileDiv.style.borderRadius = 'var(--radius-sm)';
    fileDiv.style.marginBottom = '0.5rem';
    fileDiv.innerHTML = `
        <div style="font-weight:600; font-size:0.9rem">${fileData.name}</div>
        <div style="font-size:0.75rem; color:var(--text-dim)">Shared by ${fileData.sender}</div>
        <a href="${fileData.data}" download="${fileData.name}" style="color:var(--primary); font-size:0.8rem; text-decoration:none; margin-top:0.5rem; display:block">Download</a>
    `;
    filesList.appendChild(fileDiv);
}

init();
