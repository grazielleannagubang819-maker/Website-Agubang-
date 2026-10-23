// Function for HTML Escaping
function e(value) {
    if (!value) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Database Helper using LocalStorage
function getUsersFromStorage() {
    return JSON.parse(localStorage.getItem('whimsy_users') || '[]');
}

function saveUsersToStorage(users) {
    localStorage.setItem('whimsy_users', JSON.stringify(users));
}

// Theme Management
function applyTheme(dark) {
    document.body.classList.toggle('dark-mode', dark);
    const button = document.getElementById('themeButton');
    if (button) {
        button.textContent = dark ? '☀️ Light Mode' : '🌙 Dark Mode';
        button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    }
}

function toggleDarkMode() {
    const dark = !document.body.classList.contains('dark-mode');
    try {
        localStorage.setItem('whimsyTheme', dark ? 'dark' : 'light');
    } catch (error) {}
    applyTheme(dark);
}

// Initialize Theme
let savedTheme = 'light';
try {
    savedTheme = localStorage.getItem('whimsyTheme') || 'light';
} catch (error) {}
applyTheme(savedTheme === 'dark');

// Main Execution
document.addEventListener('DOMContentLoaded', () => {

    // === CREATE USER PAGE LOGIC ===
    const createForm = document.getElementById('createForm');
    if (createForm) {
        createForm.addEventListener('submit', (evt) => {
            evt.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();

            if (name && email) {
                const users = getUsersFromStorage();
                const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
                const newUser = {
                    id: newId,
                    name: name,
                    email: email,
                    created_at: new Date().toISOString()
                };
                users.push(newUser);
                saveUsersToStorage(users);
                window.location.href = 'index.html';
            }
        });
    }

    // === UPDATE USER PAGE LOGIC ===
    const updateForm = document.getElementById('updateForm');
    if (updateForm) {
        const urlParams = new URLSearchParams(window.location.search);
        const id = parseInt(urlParams.get('id'), 10);
        const users = getUsersFromStorage();
        const user = users.find(u => u.id === id);

        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        document.getElementById('name').value = user.name;
        document.getElementById('email').value = user.email;

        updateForm.addEventListener('submit', (evt) => {
            evt.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();

            if (name && email) {
                user.name = name;
                user.email = email;
                saveUsersToStorage(users);
                window.location.href = 'index.html';
            }
        });
    }

    // === DASHBOARD INDEX PAGE LOGIC ===
    const userTableBody = document.getElementById('userTableBody');
    if (userTableBody) {
        const searchForm = document.getElementById('searchForm');
        const searchInput = document.getElementById('searchInput');
        const sortSelect = document.getElementById('sortSelect');

        const urlParams = new URLSearchParams(window.location.search);
        let search = urlParams.get('search') || '';
        let sort = urlParams.get('sort') || 'newest';
        let page = parseInt(urlParams.get('page') || '1', 10);

        searchInput.value = search;
        sortSelect.value = sort;

        function renderDashboard() {
            let users = getUsersFromStorage();

            // Total Users Stat
            const totalUsers = users.length;
            document.getElementById('totalUsers').textContent = totalUsers;

            // Joined Today Stat
            const todayStr = new Date().toISOString().slice(0, 10);
            const todayCount = users.filter(u => u.created_at && u.created_at.slice(0, 10) === todayStr).length;
            document.getElementById('todayCount').textContent = todayCount;

            // Newest Member Stat
            let newestUser = 'No users yet';
            if (users.length > 0) {
                const sortedByNewest = [...users].sort((a, b) => b.id - a.id);
                newestUser = e(sortedByNewest[0].name);
            }
            document.getElementById('newestUser').innerHTML = newestUser;

            // Search Filter
            let filtered = users.filter(u =>
                u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase())
            );

            // Sorting
            if (sort === 'newest') {
                filtered.sort((a, b) => b.id - a.id);
            } else if (sort === 'oldest') {
                filtered.sort((a, b) => a.id - b.id);
            } else if (sort === 'name_asc') {
                filtered.sort((a, b) => a.name.localeCompare(b.name));
            } else if (sort === 'name_desc') {
                filtered.sort((a, b) => b.name.localeCompare(a.name));
            }

            const filteredUsersCount = filtered.length;
            document.getElementById('filteredUsersPill').textContent = `🌿 ${filteredUsersCount} result(s)`;

            // Pagination
            const perPage = 5;
            const totalPages = Math.max(1, Math.ceil(filteredUsersCount / perPage));
            if (page < 1) page = 1;
            if (page > totalPages) page = totalPages;
            const offset = (page - 1) * perPage;

            const paginatedUsers = filtered.slice(offset, offset + perPage);

            // Render Table Rows
            if (paginatedUsers.length > 0) {
                userTableBody.innerHTML = paginatedUsers.map(u => {
                    let formattedDate = '—';
                    if (u.created_at) {
                        const dateObj = new Date(u.created_at);
                        formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                    }

                    return `
                    <tr>
                        <td>#${u.id}</td>
                        <td class="user-name">🌼 ${e(u.name)}</td>
                        <td style="overflow-wrap:anywhere;">${e(u.email)}</td>
                        <td style="white-space:nowrap;">${formattedDate}</td>
                        <td style="white-space:nowrap;">
                            <a class="action-link" href="update.html?id=${u.id}">✏️ Edit</a>
                            <button type="button" class="delete-button" onclick="deleteUser(${u.id})">🗑️ Delete</button>
                        </td>
                    </tr>
                    `;
                }).join('');
            } else {
                userTableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="empty-state">
                            <div style="font-size:42px;">🍄</div>
                            <h3>No flowers found!</h3>
                            <p>Try another search or invite someone new to your garden. ♡</p>
                            <a href="create.html" class="btn btn-add">🌱 Add a User</a>
                        </td>
                    </tr>
                `;
            }

            // Render Pagination Links
            const paginationContainer = document.getElementById('paginationContainer');
            if (totalPages > 1) {
                let navHtml = '';
                if (page > 1) {
                    navHtml += `<a class="page-link" href="?page=${page - 1}&search=${encodeURIComponent(search)}&sort=${sort}">← Previous</a> `;
                }
                navHtml += `<span class="page-current">Page ${page} of ${totalPages}</span> `;
                if (page < totalPages) {
                    navHtml += `<a class="page-link" href="?page=${page + 1}&search=${encodeURIComponent(search)}&sort=${sort}">Next →</a>`;
                }
                paginationContainer.innerHTML = navHtml;
            } else {
                paginationContainer.innerHTML = '';
            }

            // Showing Text Info
            const showingStart = filteredUsersCount ? offset + 1 : 0;
            const showingEnd = Math.min(offset + paginatedUsers.length, filteredUsersCount);
            document.getElementById('showingText').textContent = `🌷 Showing ${showingStart}–${showingEnd} of ${filteredUsersCount} matching users 🌷`;
        }

        // Search Form Submit Handler
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            search = searchInput.value.trim();
            sort = sortSelect.value;
            page = 1;
            window.history.pushState({}, '', `?page=${page}&search=${encodeURIComponent(search)}&sort=${sort}`);
            renderDashboard();
        });

        renderDashboard();
    }
});

// Delete Function
function deleteUser(id) {
    if (confirm('Remove this user from your garden? 🌷')) {
        let users = getUsersFromStorage();
        users = users.filter(u => u.id !== id);
        saveUsersToStorage(users);
        location.reload();
    }
}