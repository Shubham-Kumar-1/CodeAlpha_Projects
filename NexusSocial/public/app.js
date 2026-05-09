const API_URL = ''; // Same origin
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user'));
let isSignUp = false;

// DOM Elements
const authScreen = document.getElementById('auth-screen');
const mainScreen = document.getElementById('main-screen');
const authForm = document.getElementById('auth-form');
const toggleLink = document.getElementById('toggle-link');
const usernameGroup = document.getElementById('username-group');
const authBtn = document.getElementById('auth-btn');
const authSubtitle = document.getElementById('auth-subtitle');

const postsContainer = document.getElementById('posts-container');
const submitPostBtn = document.getElementById('submit-post');
const postContent = document.getElementById('post-content');
const postImage = document.getElementById('post-image');

const profileView = document.getElementById('profile-view');
const feedView = document.getElementById('feed-view');
const navLinks = document.querySelectorAll('.nav-links li');
const logoutBtn = document.getElementById('logout-btn');

// --- Initialization ---
function init() {
    if (token && currentUser) {
        showMainScreen();
    } else {
        showAuthScreen();
    }
}

// --- Auth Functions ---
toggleLink.addEventListener('click', () => {
    isSignUp = !isSignUp;
    usernameGroup.classList.toggle('hidden', !isSignUp);
    authBtn.innerText = isSignUp ? 'Create Account' : 'Sign In';
    authSubtitle.innerText = isSignUp ? 'Join the futuristic community' : 'Welcome back to Nexus';
    toggleLink.innerText = isSignUp ? 'Sign In' : 'Sign Up';
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const endpoint = isSignUp ? '/api/register' : '/api/login';
    const body = isSignUp ? { username, email, password } : { email, password };

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (data.error) {
            alert(data.error);
            return;
        }

        if (isSignUp) {
            alert('Registration successful! Please login.');
            toggleLink.click();
        } else {
            token = data.token;
            currentUser = data.user;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(currentUser));
            showMainScreen();
        }
    } catch (err) {
        console.error(err);
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.clear();
    location.reload();
});

// --- UI Navigation ---
function showAuthScreen() {
    authScreen.classList.remove('hidden');
    mainScreen.classList.add('hidden');
}

function showMainScreen() {
    authScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
    document.getElementById('nav-username').innerText = currentUser.username;
    document.getElementById('nav-avatar').src = currentUser.profile_pic || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + currentUser.username;
    loadFeed();
    loadSuggestions();
}

async function loadSuggestions() {
    const res = await fetch('/api/users/list/suggestions', {
        headers: { 'Authorization': token }
    });
    const users = await res.json();
    const list = document.getElementById('suggestions-list');
    list.innerHTML = '';
    users.forEach(user => {
        const div = document.createElement('div');
        div.className = 'user-suggestion';
        const avatar = user.profile_pic || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.username;
        div.innerHTML = `
            <div class="user-suggestion-info">
                <img src="${avatar}">
                <span>${user.username}</span>
            </div>
            <button class="follow-small" data-id="${user.id}">Follow</button>
        `;
        div.querySelector('button').onclick = async () => {
            await fetch(`/api/users/${user.id}/follow`, {
                method: 'POST',
                headers: { 'Authorization': token }
            });
            loadSuggestions();
        };
        list.appendChild(div);
    });
}

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        const view = link.getAttribute('data-view');
        
        if (view === 'feed') {
            feedView.classList.remove('hidden');
            profileView.classList.add('hidden');
            document.getElementById('view-title').innerText = 'Home Feed';
            loadFeed();
        } else if (view === 'profile') {
            feedView.classList.add('hidden');
            profileView.classList.remove('hidden');
            document.getElementById('view-title').innerText = 'My Profile';
            loadProfile(currentUser.id);
        }
    });
});

// --- Feed & Posts ---
async function loadFeed() {
    const res = await fetch('/api/posts');
    const posts = await res.json();
    postsContainer.innerHTML = '';
    posts.forEach(post => {
        postsContainer.appendChild(createPostCard(post));
    });
}

function createPostCard(post) {
    const card = document.createElement('div');
    card.className = 'post-card glass';
    const avatar = post.profile_pic || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + post.username;
    
    card.innerHTML = `
        <div class="post-header">
            <img src="${avatar}" alt="Avatar">
            <div>
                <div class="username">${post.username}</div>
                <div class="time">${new Date(post.created_at).toLocaleString()}</div>
            </div>
        </div>
        <div class="post-body">
            <p>${post.content}</p>
            ${post.image_url ? `<img src="${post.image_url}" class="post-image">` : ''}
        </div>
        <div class="post-footer">
            <div class="post-action like-btn" data-id="${post.id}">
                <i class="fa-regular fa-heart"></i> <span>${post.like_count}</span>
            </div>
            <div class="post-action comment-btn" data-id="${post.id}">
                <i class="fa-regular fa-comment"></i> <span>${post.comment_count}</span>
            </div>
        </div>
    `;

    card.querySelector('.like-btn').addEventListener('click', async () => {
        await fetch(`/api/posts/${post.id}/like`, {
            method: 'POST',
            headers: { 'Authorization': token }
        });
        loadFeed();
    });

    card.querySelector('.comment-btn').addEventListener('click', () => {
        openCommentModal(post.id);
    });

    return card;
}

submitPostBtn.addEventListener('click', async () => {
    const content = postContent.value;
    const file = postImage.files[0];
    if (!content && !file) return;

    const formData = new FormData();
    formData.append('content', content);
    if (file) formData.append('image', file);

    const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Authorization': token },
        body: formData
    });

    if (res.ok) {
        postContent.value = '';
        postImage.value = '';
        loadFeed();
    }
});

// --- Profile ---
async function loadProfile(userId) {
    const res = await fetch(`/api/users/${userId}`);
    const user = await res.json();
    
    document.getElementById('profile-username').innerText = user.username;
    document.getElementById('profile-pic-large').src = user.profile_pic || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.username;
    document.getElementById('profile-bio').innerText = user.bio || 'No bio yet.';
    document.getElementById('stat-followers').innerText = user.followers;
    document.getElementById('stat-following').innerText = user.following;

    // Load user's own posts
    const postsRes = await fetch('/api/posts'); // For simplicity, filtering all posts on frontend
    const allPosts = await postsRes.json();
    const userPosts = allPosts.filter(p => p.user_id === userId);
    
    const container = document.getElementById('user-posts-container');
    container.innerHTML = '';
    userPosts.forEach(post => container.appendChild(createPostCard(post)));
}

// --- Comments Modal ---
const modal = document.getElementById('comment-modal');
const closeModal = document.querySelector('.close-modal');
let activePostId = null;

function openCommentModal(postId) {
    activePostId = postId;
    modal.classList.remove('hidden');
    loadComments(postId);
}

closeModal.onclick = () => modal.classList.add('hidden');
window.onclick = (event) => { if (event.target == modal) modal.classList.add('hidden'); }

async function loadComments(postId) {
    const res = await fetch(`/api/posts/${postId}/comments`);
    const comments = await res.json();
    const list = document.getElementById('comments-list');
    list.innerHTML = '';
    comments.forEach(c => {
        const div = document.createElement('div');
        div.style.marginBottom = '0.5rem';
        div.innerHTML = `<strong>${c.username}:</strong> ${c.content}`;
        list.appendChild(div);
    });
}

document.getElementById('submit-comment').addEventListener('click', async () => {
    const content = document.getElementById('new-comment').value;
    if (!content) return;

    await fetch(`/api/posts/${activePostId}/comment`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': token 
        },
        body: JSON.stringify({ content })
    });

    document.getElementById('new-comment').value = '';
    loadComments(activePostId);
    loadFeed();
});

init();
