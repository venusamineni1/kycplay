const API_BASE_URL = '/api/clients';

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.endsWith('details.html')) {
        loadClientDetails();
    } else if (path.endsWith('related-party-details.html')) {
        loadRelatedPartyDetails();
    } else if (path.endsWith('changes.html')) {
        loadMaterialChanges();
    } else if (path.endsWith('clients.html')) {
        loadClientList();
        initSearch();
    } else if (path.endsWith('permissions.html')) {
        initPermissionsPage();
    } else {
        checkPermissions();
    }
});

let currentUserPermissions = [];

async function checkPermissions() {
    try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
            const user = await response.json();
            currentUserPermissions = user.permissions || [];

            const changesLink = document.getElementById('changesLink');
            const permissionsLink = document.getElementById('permissionsLink');
            const userMgmtLink = document.querySelector('a[href="users.html"]');

            // Dashboard cards
            const clientsCard = document.getElementById('clientsCard');
            const changesCard = document.getElementById('changesCard');
            const usersCard = document.getElementById('usersCard');
            const permissionsCard = document.getElementById('permissionsCard');

            if (changesLink) {
                changesLink.style.display = hasPermission('VIEW_CHANGES') ? 'inline-block' : 'none';
            }
            if (permissionsLink) {
                permissionsLink.style.display = hasPermission('MANAGE_PERMISSIONS') ? 'inline-block' : 'none';
            }
            if (userMgmtLink) {
                userMgmtLink.style.display = hasPermission('MANAGE_USERS') ? 'inline-block' : 'none';
            }

            if (clientsCard) {
                clientsCard.style.display = hasPermission('VIEW_CLIENTS') ? 'block' : 'none';
            }
            if (changesCard) {
                changesCard.style.display = hasPermission('VIEW_CHANGES') ? 'block' : 'none';
            }
            if (usersCard) {
                usersCard.style.display = hasPermission('MANAGE_USERS') ? 'block' : 'none';
            }
            if (permissionsCard) {
                permissionsCard.style.display = hasPermission('MANAGE_PERMISSIONS') ? 'block' : 'none';
            }

            // Also check for ad-hoc buttons in the page
            updateActionButtons();
        }
    } catch (e) {
        console.error('Permission check failed', e);
    }
}

function hasPermission(permission) {
    return currentUserPermissions.includes(permission);
}

function updateActionButtons() {
    // This will be called whenever permissions are loaded or UI changes
    const addRPBtn = document.querySelector('.section-header button');
    if (addRPBtn && addRPBtn.textContent.includes('Add Related Party')) {
        addRPBtn.style.display = hasPermission('EDIT_CLIENTS') ? 'inline-block' : 'none';
    }
}

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let timeout = null;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                loadClientList(e.target.value);
            }, 300); // Debounce
        });
    }
}

async function loadClientList(query = '') {
    const contentDiv = document.getElementById('content');
    try {
        const url = query ? `${API_BASE_URL}/search?query=${encodeURIComponent(query)}` : API_BASE_URL;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch clients');

        const clients = await response.json();

        if (clients.length === 0) {
            contentDiv.innerHTML = '<p>No clients found.</p>';
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Onboarding Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

        clients.forEach(client => {
            html += `
                <tr>
                    <td>${client.clientID}</td>
                    <td><a href="details.html?id=${client.clientID}">${client.firstName} ${client.lastName}</a></td>
                    <td>${client.onboardingDate}</td>
                    <td>${client.status}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        contentDiv.innerHTML = html;

    } catch (error) {
        console.error(error);
        contentDiv.innerHTML = `<p class="error">Error loading clients: ${error.message}</p>`;
    }
}

async function loadClientDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const content = document.getElementById('content');

    if (!id) {
        content.innerHTML = '<p class="error">No client ID provided.</p>';
        return;
    }

    try {
        // Fetch User Role first
        const userRes = await fetch('/api/users/me');
        if (!userRes.ok) throw new Error('Not authenticated');
        const userData = await userRes.json();
        const userRole = userData.role;

        // Fetch Client Details
        const response = await fetch(`${API_BASE_URL}/${id}`);
        if (!response.ok) throw new Error('Failed to fetch client details');
        const client = await response.json();

        let html = `
            <div class="client-detail">
                <p><strong>Client ID:</strong> ${client.clientID}</p>
                <p><strong>Title Prefix:</strong> ${client.titlePrefix || '-'}</p>
                <p><strong>First Name:</strong> ${client.firstName}</p>
                <p><strong>Middle Name:</strong> ${client.middleName || '-'}</p>
                <p><strong>Last Name:</strong> ${client.lastName || '-'}</p>
                <p><strong>Title Suffix:</strong> ${client.titleSuffix || '-'}</p>
                <p><strong>Citizenship 1:</strong> ${client.citizenship1 || '-'}</p>
                <p><strong>Citizenship 2:</strong> ${client.citizenship2 || '-'}</p>
                <p><strong>Onboarding Date:</strong> ${client.onboardingDate}</p>
                <p><strong>Status:</strong> ${client.status}</p>
                
                <div class="section-header">
                    <h2>Related Parties</h2>
                    <button class="btn" onclick="showAddRelatedPartyModal()">Add Related Party</button>
                </div>
                <div id="relatedPartiesContent">
                    ${renderRelatedParties(client.relatedParties)}
                </div>

                ${renderAdminOnlySections(client, userRole)}

                <div style="margin-top: 2rem;">
                    <a href="index.html" class="back-link">← Back to List</a>
                    <a href="/logout" class="back-link" style="margin-left: 10px;">Logout</a>
                </div>
            </div>
            
            <div id="addRelatedPartyModal" class="modal">
                <div class="modal-content">
                    <h2>Add Related Party</h2>
                    <form id="addRelatedPartyForm">
                        <div class="form-group">
                            <label>Relation Type</label>
                            <select id="rpRelationType" required>
                                <option value="Legal representative">Legal representative</option>
                                <option value="Power of Attorney">Power of Attorney</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group"><label>Title Prefix</label><input type="text" id="rpTitlePrefix"></div>
                            <div class="form-group"><label>First Name</label><input type="text" id="rpFirstName" required></div>
                            <div class="form-group"><label>Middle Name</label><input type="text" id="rpMiddleName"></div>
                            <div class="form-group"><label>Last Name</label><input type="text" id="rpLastName" required></div>
                            <div class="form-group"><label>Title Suffix</label><input type="text" id="rpTitleSuffix"></div>
                            <div class="form-group"><label>Citizenship 1</label><input type="text" id="rpCitizenship1"></div>
                            <div class="form-group"><label>Citizenship 2</label><input type="text" id="rpCitizenship2"></div>
                            <div class="form-group"><label>Status</label><input type="text" id="rpStatus" value="Active"></div>
                        </div>
                        <div style="margin-top: 1rem; text-align: right;">
                            <button type="button" class="btn btn-secondary" onclick="hideAddRelatedPartyModal()">Cancel</button>
                            <button type="submit" class="btn">Save</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        content.innerHTML = html;

        document.getElementById('addRelatedPartyForm').onsubmit = async (e) => {
            e.preventDefault();
            await saveRelatedParty(client.clientID);
        };

        updateActionButtons();
    } catch (error) {
        console.error('Error loading client details:', error);
        content.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
}

function renderRelatedParties(parties) {
    if (!parties || parties.length === 0) return '<p>No related parties found.</p>';

    let html = '<table><thead><tr><th>Type</th><th>Name</th><th>Citizenship</th><th>Status</th></tr></thead><tbody>';
    parties.forEach(p => {
        html += `
            <tr>
                <td>${p.relationType}</td>
                <td><a href="related-party-details.html?id=${p.relatedPartyID}">${p.titlePrefix || ''} ${p.firstName} ${p.middleName || ''} ${p.lastName} ${p.titleSuffix || ''}</a></td>
                <td>${p.citizenship1 || ''}${p.citizenship2 ? ', ' + p.citizenship2 : ''}</td>
                <td>${p.status}</td>
            </tr>
        `;
    });
    html += '</tbody></table>';
    return html;
}

function renderAdminOnlySections(client, userRole) {
    if (userRole !== 'ADMIN') return '';

    let html = '';

    // Addresses
    html += `
        <h2>Addresses</h2>
        ${client.addresses && client.addresses.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Street</th>
                    <th>City</th>
                    <th>Zip</th>
                    <th>Country</th>
                </tr>
            </thead>
            <tbody>
                ${client.addresses.map(addr => `
                    <tr>
                        <td>${addr.addressType}</td>
                        <td>${addr.addressLine1} ${addr.addressLine2 || ''}</td>
                        <td>${addr.city}</td>
                        <td>${addr.zip}</td>
                        <td>${addr.country}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ` : '<p>No addresses found.</p>'}
    `;

    // Identifiers
    html += `
        <h2>Identifiers</h2>
        ${client.identifiers && client.identifiers.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Authority</th>
                </tr>
            </thead>
            <tbody>
                ${client.identifiers.map(id => `
                    <tr>
                        <td>${id.identifierType}</td>
                        <td>${id.identifierValue}</td>
                        <td>${id.issuingAuthority}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ` : '<p>No identifiers found.</p>'}
    `;

    return html;
}

function showAddRelatedPartyModal() {
    document.getElementById('addRelatedPartyModal').style.display = 'block';
}

function hideAddRelatedPartyModal() {
    document.getElementById('addRelatedPartyModal').style.display = 'none';
    document.getElementById('addRelatedPartyForm').reset();
}

async function saveRelatedParty(clientID) {
    const rp = {
        relationType: document.getElementById('rpRelationType').value,
        titlePrefix: document.getElementById('rpTitlePrefix').value,
        firstName: document.getElementById('rpFirstName').value,
        middleName: document.getElementById('rpMiddleName').value,
        lastName: document.getElementById('rpLastName').value,
        titleSuffix: document.getElementById('rpTitleSuffix').value,
        citizenship1: document.getElementById('rpCitizenship1').value,
        citizenship2: document.getElementById('rpCitizenship2').value,
        status: document.getElementById('rpStatus').value,
        onboardingDate: new Date().toISOString().split('T')[0]
    };

    try {
        const response = await fetch(`/api/clients/${clientID}/related-parties`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rp)
        });

        if (response.ok) {
            hideAddRelatedPartyModal();
            loadClientDetails(); // Reload to show the new party
        } else {
            alert('Failed to save related party');
        }
    } catch (error) {
        console.error('Error saving related party:', error);
        alert('Error saving related party');
    }
}

async function loadRelatedPartyDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const content = document.getElementById('content');

    if (!id) {
        content.innerHTML = '<p class="error">No related party ID provided.</p>';
        return;
    }

    try {
        // Fetch User Role first
        const userRes = await fetch('/api/users/me');
        if (!userRes.ok) throw new Error('Not authenticated');
        const userData = await userRes.json();
        const userRole = userData.role;

        // Fetch Related Party Details
        const response = await fetch(`/api/clients/related-parties/${id}`);
        if (!response.ok) throw new Error('Failed to fetch related party details');
        const party = await response.json();

        let html = `
            <div class="client-detail">
                <p><strong>Relation Type:</strong> ${party.relationType}</p>
                <p><strong>Title Prefix:</strong> ${party.titlePrefix || '-'}</p>
                <p><strong>First Name:</strong> ${party.firstName}</p>
                <p><strong>Middle Name:</strong> ${party.middleName || '-'}</p>
                <p><strong>Last Name:</strong> ${party.lastName || '-'}</p>
                <p><strong>Title Suffix:</strong> ${party.titleSuffix || '-'}</p>
                <p><strong>Citizenship 1:</strong> ${party.citizenship1 || '-'}</p>
                <p><strong>Citizenship 2:</strong> ${party.citizenship2 || '-'}</p>
                <p><strong>Status:</strong> ${party.status}</p>
                
                ${renderAdminOnlySections(party, userRole)}

                <div style="margin-top: 2rem;">
                    <a href="details.html?id=${party.clientID}" class="back-link">← Back to Client</a>
                    <a href="/logout" class="back-link" style="margin-left: 10px;">Logout</a>
                </div>
            </div>
        `;
        content.innerHTML = html;
    } catch (error) {
        console.error('Error loading related party details:', error);
        content.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
}

async function loadMaterialChanges() {
    const content = document.getElementById('content');
    try {
        const response = await fetch('/api/clients/changes');
        if (!response.ok) throw new Error('Failed to fetch material changes');
        const changes = await response.json();

        if (changes.length === 0) {
            content.innerHTML = '<p>No material changes found.</p>';
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Change ID</th>
                        <th>Date</th>
                        <th>Client ID</th>
                        <th>Entity ID</th>
                        <th>Entity Name</th>
                        <th>Column</th>
                        <th>Operation</th>
                        <th>Old Value</th>
                        <th>New Value</th>
                    </tr>
                </thead>
                <tbody>
        `;

        changes.forEach(change => {
            html += `
                <tr>
                    <td>${change.changeID}</td>
                    <td>${new Date(change.changeDate).toLocaleString()}</td>
                    <td>${change.clientID}</td>
                    <td>${change.entityID}</td>
                    <td>${change.entityName}</td>
                    <td>${change.columnName}</td>
                    <td>${change.operationType}</td>
                    <td style="color: #ff5555;">${change.oldValue || '-'}</td>
                    <td style="color: #55ff55;">${change.newValue || '-'}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        content.innerHTML = html;
    } catch (error) {
        console.error('Error loading material changes:', error);
        content.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
}

async function initPermissionsPage() {
    const roleSelector = document.getElementById('roleSelector');
    const permissionsList = document.getElementById('permissionsList');
    const permissionsGrid = document.getElementById('permissionsGrid');
    const saveBtn = document.getElementById('savePermissionsBtn');

    if (!roleSelector) return;

    try {
        // Load roles
        const rolesRes = await fetch('/api/permissions/roles');
        const roles = await rolesRes.json();
        roles.forEach(role => {
            const opt = document.createElement('option');
            opt.value = role;
            opt.textContent = role;
            roleSelector.appendChild(opt);
        });

        // Load all permissions
        const allPermsRes = await fetch('/api/permissions/all');
        const allPermissions = await allPermsRes.json();

        roleSelector.onchange = async () => {
            const role = roleSelector.value;
            if (!role) {
                permissionsList.style.display = 'none';
                return;
            }

            const rolePermsRes = await fetch(`/api/permissions/role/${role}`);
            const rolePermissions = await rolePermsRes.json();

            permissionsGrid.innerHTML = '';
            allPermissions.forEach(perm => {
                const div = document.createElement('div');
                div.className = 'form-group';
                div.style.display = 'flex';
                div.style.alignItems = 'center';
                div.style.gap = '0.5rem';

                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.value = perm;
                cb.checked = rolePermissions.includes(perm);
                cb.id = `perm_${perm}`;

                const label = document.createElement('label');
                label.htmlFor = `perm_${perm}`;
                label.textContent = perm;
                label.style.marginBottom = '0';

                div.appendChild(cb);
                div.appendChild(label);
                permissionsGrid.appendChild(div);
            });

            permissionsList.style.display = 'block';
        };

        saveBtn.onclick = async () => {
            const role = roleSelector.value;
            const selected = Array.from(permissionsGrid.querySelectorAll('input:checked')).map(cb => cb.value);

            try {
                const res = await fetch(`/api/permissions/role/${role}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ permissions: selected })
                });
                if (res.ok) {
                    alert('Permissions updated successfully!');
                } else {
                    alert('Failed to update permissions');
                }
            } catch (e) {
                console.error(e);
                alert('Error updating permissions');
            }
        };

    } catch (e) {
        console.error(e);
    }
}
