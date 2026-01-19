const API_BASE_URL = '/api/clients';

function initTheme() {
    const savedTheme = localStorage.getItem('app-theme') || 'theme-midnight';
    document.body.className = savedTheme;

    const switcher = document.getElementById('themeSwitcher');
    if (switcher) {
        switcher.value = savedTheme;
        switcher.addEventListener('change', (e) => {
            switchTheme(e.target.value);
        });
    }
}

function switchTheme(themeName) {
    document.body.className = themeName;
    localStorage.setItem('app-theme', themeName);
}

document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    const path = window.location.pathname;

    // Check specific paths first before generic ones
    if (path.endsWith('case-details.html')) {
        await checkPermissions(); // Ensure permissions are loaded
        loadCaseDetails();
    } else if (path.endsWith('related-party-details.html')) {
        loadRelatedPartyDetails();
    } else if (path.endsWith('details.html')) {
        await checkPermissions();
        loadClientDetails();
    } else if (path.endsWith('changes.html')) {
        loadMaterialChanges();
    } else if (path.endsWith('clients.html')) {
        loadClientList();
        initSearch();
    } else if (path.endsWith('cases.html')) {
        loadCaseList();
    } else if (path.endsWith('permissions.html')) {
        initPermissionsPage();
    } else if (path.endsWith('admin-questionnaire.html')) {
        initAdminQuestionnaire();
    } else {
        checkPermissions();
    }
});

let currentUserPermissions = [];
let currentUserRole = '';

// Global data for export
let currentClientsData = [];
let currentChangesData = [];

async function checkPermissions() {
    try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
            const user = await response.json();
            currentUserPermissions = user.permissions || [];
            currentUserRole = user.role || '';

            const changesLink = document.getElementById('changesLink');
            const permissionsLink = document.getElementById('permissionsLink');
            const userMgmtLink = document.querySelector('a[href="users.html"]');

            // Dashboard cards
            const clientsCard = document.getElementById('clientsCard');
            const changesCard = document.getElementById('changesCard');
            const usersCard = document.getElementById('usersCard');
            const permissionsCard = document.getElementById('permissionsCard');
            const casesCard = document.getElementById('casesCard');

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
            if (casesCard) {
                casesCard.style.display = hasPermission('MANAGE_CASES') ? 'block' : 'none';
            }
            const qCard = document.getElementById('questionnaireCard');
            if (qCard) {
                qCard.style.display = currentUserRole === 'ADMIN' ? 'block' : 'none';
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
                loadClientList(e.target.value, 0); // Reset to page 0 on search
            }, 300); // Debounce
        });
    }
}

function renderPagination(containerId, data, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (data.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = `
        <button class="pagination-btn" ${data.currentPage === 0 ? 'disabled' : ''} onclick="window.${onPageChange}(${data.currentPage - 1})">Previous</button>
        <span class="pagination-info">Page ${data.currentPage + 1} of ${data.totalPages}</span>
        <button class="pagination-btn" ${data.currentPage >= data.totalPages - 1 ? 'disabled' : ''} onclick="window.${onPageChange}(${data.currentPage + 1})">Next</button>
    `;
    container.innerHTML = html;
}

async function loadClientList(query = '', page = 0) {
    const contentDiv = document.getElementById('content');
    const exportBtn = document.getElementById('exportClientsBtn');

    // Make it globally accessible for pagination buttons
    window.loadClientPage = (p) => loadClientList(document.getElementById('searchInput')?.value || '', p);

    if (exportBtn) {
        exportBtn.onclick = () => exportToExcel(currentClientsData, 'Client_Directory.xlsx');
    }

    try {
        let url = query
            ? `${API_BASE_URL}/search?query=${encodeURIComponent(query)}&page=${page}`
            : `${API_BASE_URL}?page=${page}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch clients');

        const data = await response.json();
        const clients = data.content;
        currentClientsData = clients; // Store for export

        if (clients.length === 0) {
            contentDiv.innerHTML = '<p>No clients found.</p>';
            renderPagination('pagination', data, 'loadClientPage');
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
        renderPagination('pagination', data, 'loadClientPage');

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
                <div class="case-info-grid">
                    <div class="info-item"><strong>Client ID</strong><span>${client.clientID}</span></div>
                    <div class="info-item"><strong>Status</strong><span>${client.status}</span></div>
                    <div class="info-item"><strong>Onboarding Date</strong><span>${client.onboardingDate}</span></div>
                    <div class="info-item"><strong>Gender</strong><span>${client.gender || '-'}</span></div>
                </div>

                <div class="section-header"><h2>Personal Information</h2></div>
                <div class="case-info-grid">
                    <div class="info-item"><strong>Title Prefix</strong><span>${client.titlePrefix || '-'}</span></div>
                    <div class="info-item"><strong>First Name</strong><span>${client.firstName}</span></div>
                    <div class="info-item"><strong>Middle Name</strong><span>${client.middleName || '-'}</span></div>
                    <div class="info-item"><strong>Last Name</strong><span>${client.lastName || '-'}</span></div>
                    <div class="info-item"><strong>Title Suffix</strong><span>${client.titleSuffix || '-'}</span></div>
                    <div class="info-item"><strong>Name at Birth</strong><span>${client.nameAtBirth || '-'}</span></div>
                    <div class="info-item"><strong>Nick Name</strong><span>${client.nickName || '-'}</span></div>
                    <div class="info-item"><strong>Date of Birth</strong><span>${client.dateOfBirth || '-'}</span></div>
                </div>

                <div class="section-header"><h2>Citizenship & Tax</h2></div>
                <div class="case-info-grid">
                    <div class="info-item"><strong>Citizenship 1</strong><span>${client.citizenship1 || '-'}</span></div>
                    <div class="info-item"><strong>Citizenship 2</strong><span>${client.citizenship2 || '-'}</span></div>
                    <div class="info-item"><strong>Language</strong><span>${client.language || '-'}</span></div>
                    <div class="info-item"><strong>Country of Tax</strong><span>${client.countryOfTax || '-'}</span></div>
                    <div class="info-item"><strong>FATCA Status</strong><span>${client.fatcaStatus || '-'}</span></div>
                    <div class="info-item"><strong>CRS Status</strong><span>${client.crsStatus || '-'}</span></div>
                </div>

                <div class="section-header"><h2>Professional & Funds</h2></div>
                <div class="case-info-grid">
                    <div class="info-item"><strong>Occupation</strong><span>${client.occupation || '-'}</span></div>
                    <div class="info-item"><strong>Source of Funds</strong><span>${client.sourceOfFundsCountry || '-'}</span></div>
                </div>
                
                <div class="section-header">
                    <h2>Related Parties</h2>
                    <button class="btn" onclick="showAddRelatedPartyModal()">Add Related Party</button>
                </div>
                <div id="relatedPartiesContent">
                    ${renderRelatedParties(client.relatedParties)}
                </div>

                ${renderAdminOnlySections(client, userRole)}

                <div class="section-header">
                    <h2>Portfolios</h2>
                </div>
                <div id="portfoliosContent">
                    ${renderPortfolios(client.portfolios)}
                </div>

                <div style="margin-top: 2rem;">
                    <a href="clients.html" class="back-link">← Back to List</a>
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
                            <div class="form-group"><label>Name at Birth</label><input type="text" id="rpNameAtBirth"></div>
                            <div class="form-group"><label>Nick Name</label><input type="text" id="rpNickName"></div>
                            <div class="form-group"><label>Gender</label><input type="text" id="rpGender"></div>
                            <div class="form-group"><label>Date of Birth</label><input type="date" id="rpDateOfBirth"></div>
                            <div class="form-group"><label>Citizenship 1</label><input type="text" id="rpCitizenship1"></div>
                            <div class="form-group"><label>Citizenship 2</label><input type="text" id="rpCitizenship2"></div>
                            <div class="form-group"><label>Language</label><input type="text" id="rpLanguage"></div>
                            <div class="form-group"><label>Occupation</label><input type="text" id="rpOccupation"></div>
                            <div class="form-group"><label>Country of Tax</label><input type="text" id="rpCountryOfTax"></div>
                            <div class="form-group"><label>Source of Funds Country</label><input type="text" id="rpSourceOfFundsCountry"></div>
                            <div class="form-group"><label>FATCA Status</label><input type="text" id="rpFatcaStatus"></div>
                            <div class="form-group"><label>CRS Status</label><input type="text" id="rpCrsStatus"></div>
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

        const actionsDiv = document.getElementById('clientActions');
        if (actionsDiv && hasPermission('MANAGE_CASES')) {
            actionsDiv.innerHTML = `<button class="btn" onclick="showCreateCaseModal(${client.clientID})">Create KYC Case</button>`;
        }

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

function renderPortfolios(portfolios) {
    if (!portfolios || portfolios.length === 0) return '<p>No portfolios found.</p>';

    let html = '<table><thead><tr><th>Portfolio ID</th><th>Account Number</th><th>Portfolio Text</th><th>Onboarding</th><th>Offboarding</th><th>Status</th></tr></thead><tbody>';
    portfolios.forEach(p => {
        html += `
            <tr>
                <td>${p.portfolioID}</td>
                <td>${p.accountNumber || '-'}</td>
                <td>${p.portfolioText}</td>
                <td>${p.onboardingDate}</td>
                <td>${p.offboardingDate || '-'}</td>
                <td><span class="status-badge">${p.status}</span></td>
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
                    <th>Number</th>
                    <th>Supplement</th>
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
                        <td>${addr.addressNumber || '-'}</td>
                        <td>${addr.addressSupplement || '-'}</td>
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
                    <th>Number</th>
                    <th>Authority</th>
                </tr>
            </thead>
            <tbody>
                ${client.identifiers.map(id => `
                    <tr>
                        <td>${id.identifierType}</td>
                        <td>${id.identifierValue}</td>
                        <td>${id.identifierNumber || '-'}</td>
                        <td>${id.issuingAuthority}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ` : '<p>No identifiers found.</p>'}
    `;

    // Accounts
    html += `
        <h2>Accounts</h2>
        ${client.accounts && client.accounts.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th>Account Number</th>
                    <th>Account Status</th>
                </tr>
            </thead>
            <tbody>
                ${client.accounts.map(acc => `
                    <tr>
                        <td>${acc.accountNumber}</td>
                        <td>${acc.accountStatus}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ` : '<p>No accounts found.</p>'}
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
        onboardingDate: new Date().toISOString().split('T')[0],
        nameAtBirth: document.getElementById('rpNameAtBirth').value,
        nickName: document.getElementById('rpNickName').value,
        gender: document.getElementById('rpGender').value,
        dateOfBirth: document.getElementById('rpDateOfBirth').value || null,
        language: document.getElementById('rpLanguage').value,
        occupation: document.getElementById('rpOccupation').value,
        countryOfTax: document.getElementById('rpCountryOfTax').value,
        sourceOfFundsCountry: document.getElementById('rpSourceOfFundsCountry').value,
        fatcaStatus: document.getElementById('rpFatcaStatus').value,
        crsStatus: document.getElementById('rpCrsStatus').value
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
        console.error('Error saving case:', error);
        alert('Failed to save case: ' + error.message);
    }
}

/**
 * Utility function to export data to Excel using SheetJS
 * @param {Array} data - Array of objects to export
 * @param {string} filename - The name of the file to download
 */
function exportToExcel(data, filename) {
    if (!data || data.length === 0) {
        alert('No data available to export');
        return;
    }

    try {
        // Create a new workbook
        const wb = XLSX.utils.book_new();

        // Convert JSON data to worksheet
        const ws = XLSX.utils.json_to_sheet(data);

        // Append worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Data");

        // Export the workbook
        XLSX.writeFile(wb, filename);
    } catch (error) {
        console.error('Excel Export Error:', error);
        alert('Failed to export Excel: ' + error.message);
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
                <div class="case-info-grid">
                    <div class="info-item"><strong>Relation Type</strong><span>${party.relationType}</span></div>
                    <div class="info-item"><strong>Status</strong><span>${party.status}</span></div>
                    <div class="info-item"><strong>Onboarding Date</strong><span>${party.onboardingDate || '-'}</span></div>
                    <div class="info-item"><strong>Gender</strong><span>${party.gender || '-'}</span></div>
                </div>

                <div class="section-header"><h2>Personal Information</h2></div>
                <div class="case-info-grid">
                    <div class="info-item"><strong>Title Prefix</strong><span>${party.titlePrefix || '-'}</span></div>
                    <div class="info-item"><strong>First Name</strong><span>${party.firstName}</span></div>
                    <div class="info-item"><strong>Middle Name</strong><span>${party.middleName || '-'}</span></div>
                    <div class="info-item"><strong>Last Name</strong><span>${party.lastName || '-'}</span></div>
                    <div class="info-item"><strong>Title Suffix</strong><span>${party.titleSuffix || '-'}</span></div>
                    <div class="info-item"><strong>Name at Birth</strong><span>${party.nameAtBirth || '-'}</span></div>
                    <div class="info-item"><strong>Nick Name</strong><span>${party.nickName || '-'}</span></div>
                    <div class="info-item"><strong>Date of Birth</strong><span>${party.dateOfBirth || '-'}</span></div>
                </div>

                <div class="section-header"><h2>Citizenship & Tax</h2></div>
                <div class="case-info-grid">
                    <div class="info-item"><strong>Citizenship 1</strong><span>${party.citizenship1 || '-'}</span></div>
                    <div class="info-item"><strong>Citizenship 2</strong><span>${party.citizenship2 || '-'}</span></div>
                    <div class="info-item"><strong>Language</strong><span>${party.language || '-'}</span></div>
                    <div class="info-item"><strong>Country of Tax</strong><span>${party.countryOfTax || '-'}</span></div>
                    <div class="info-item"><strong>FATCA Status</strong><span>${party.fatcaStatus || '-'}</span></div>
                    <div class="info-item"><strong>CRS Status</strong><span>${party.crsStatus || '-'}</span></div>
                </div>

                <div class="section-header"><h2>Professional & Funds</h2></div>
                <div class="case-info-grid">
                    <div class="info-item"><strong>Occupation</strong><span>${party.occupation || '-'}</span></div>
                    <div class="info-item"><strong>Source of Funds</strong><span>${party.sourceOfFundsCountry || '-'}</span></div>
                </div>
                
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

async function loadMaterialChanges(page = 0) {
    const content = document.getElementById('content');
    const exportBtn = document.getElementById('exportChangesBtn');

    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;

    window.loadChangesPage = (p) => loadMaterialChanges(p);

    if (exportBtn) {
        exportBtn.onclick = () => exportToExcel(currentChangesData, 'Material_Changes.xlsx');
    }

    try {
        let url = `/api/clients/changes?page=${page}`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch material changes');
        const data = await response.json();
        const changes = data.content;
        currentChangesData = changes; // Store for export

        if (changes.length === 0) {
            content.innerHTML = '<p>No material changes found.</p>';
            renderPagination('pagination', data, 'loadChangesPage');
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
        renderPagination('pagination', data, 'loadChangesPage');
    } catch (error) {
        console.error('Error loading material changes:', error);
        content.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
}

function clearChangesFilter() {
    const start = document.getElementById('startDate');
    const end = document.getElementById('endDate');
    if (start) start.value = '';
    if (end) end.value = '';
    loadMaterialChanges(0);
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

async function loadCaseList() {
    const content = document.getElementById('content');
    try {
        const res = await fetch('/api/cases');
        const cases = await res.json();

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Case ID</th>
                        <th>Client</th>
                        <th>Status</th>
                        <th>Reason</th>
                        <th>Assigned</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
        `;

        cases.forEach(c => {
            html += `
                <tr>
                    <td>${c.caseID}</td>
                    <td>${c.clientName}</td>
                    <td><span class="status-badge" style="background: rgba(255,255,255,0.1); border: 1px solid var(--glass-border); padding: 0.2rem 0.5rem; border-radius: 4px;">${c.status}</span></td>
                    <td>${c.reason}</td>
                    <td>${c.assignedTo || '-'}</td>
                    <td><a href="case-details.html?id=${c.caseID}" class="back-link" style="margin: 0; padding: 0.3rem 0.6rem;">Details</a></td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        content.innerHTML = html;
    } catch (e) {
        content.innerHTML = `<p class="error">Error loading cases: ${e.message}</p>`;
    }
}

async function loadCaseDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('id');
    const caseTitle = document.getElementById('caseTitle');
    const caseInfo = document.getElementById('caseInfo');
    const commentsList = document.getElementById('commentsList');
    const docsList = document.getElementById('documentsList');

    try {
        const [caseRes, commentsRes, docsRes] = await Promise.all([
            fetch(`/api/cases/${caseId}`),
            fetch(`/api/cases/${caseId}/comments`),
            fetch(`/api/cases/${caseId}/documents`)
        ]);

        const kycCase = await caseRes.json();
        const comments = await commentsRes.json();
        const docs = await docsRes.json();

        caseTitle.textContent = `Case #${kycCase.caseID} - ${kycCase.clientName}`;
        caseInfo.innerHTML = `
            <div class="info-item"><strong>Case ID</strong><span>${kycCase.caseID}</span></div>
            <div class="info-item"><strong>Client ID</strong><span>${kycCase.clientID}</span></div>
            <div class="info-item"><strong>Client Name</strong><span>${kycCase.clientName}</span></div>
            <div class="info-item" style="grid-column: 1 / -1;"><strong>Reason</strong><span>${kycCase.reason}</span></div>
            <div class="info-item"><strong>Status</strong><span><span class="status-badge">${kycCase.status}</span></span></div>
            <div class="info-item"><strong>Assigned To</strong><span>${kycCase.assignedTo || 'Unassigned'}</span></div>
            <div class="info-item"><strong>Created</strong><span>${new Date(kycCase.createdDate).toLocaleString()}</span></div>
        `;

        // Update workflow UI
        document.querySelectorAll('.workflow-step').forEach(step => {
            step.classList.remove('active');
            if (step.dataset.step === kycCase.status) step.classList.add('active');
        });

        // Load Comments
        commentsList.innerHTML = comments.map(c => `
            <div class="comment-item">
                <div class="meta">${c.userID} (${c.role}) - ${new Date(c.commentDate).toLocaleString()}</div>
                <div>${c.commentText}</div>
            </div>
        `).join('') || '<p>No comments yet.</p>';

        // Load Docs as Table
        docsList.innerHTML = docs.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Name</th>
                        <th>Uploaded By</th>
                        <th>Uploaded On</th>
                        <th>Comment</th>
                    </tr>
                </thead>
                <tbody>
                    ${docs.map(d => `
                        <tr>
                            <td><span class="status-badge">${d.category || 'Other'}</span></td>
                            <td><a href="/api/cases/documents/${d.documentID}" target="_blank">${d.documentName}</a></td>
                            <td>${d.uploadedBy || '-'}</td>
                            <td>${new Date(d.uploadDate).toLocaleString()}</td>
                            <td><small>${d.comment || '-'}</small></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        ` : '<p>No documents uploaded.</p>';

        // Setup Modal logic
        const uploadModal = document.getElementById('uploadModal');
        const openBtn = document.getElementById('openUploadModalBtn');
        const closeBtn = document.getElementById('closeUploadModalBtn');
        const uploadForm = document.getElementById('uploadForm');

        if (openBtn) {
            openBtn.onclick = () => uploadModal.style.display = 'block';
        }
        if (closeBtn) {
            closeBtn.onclick = () => {
                uploadModal.style.display = 'none';
                uploadForm.reset();
            };
        }

        if (uploadForm) {
            uploadForm.onsubmit = async (e) => {
                e.preventDefault();
                const file = document.getElementById('fileInput').files[0];
                const category = document.getElementById('docCategory').value;
                const comment = document.getElementById('docComment').value;
                await uploadDoc(caseId, file, category, comment);
            };
        }

        // Setup Actions based on permissions
        const requiredPerm = {
            'KYC_ANALYST': 'APPROVE_CASES_STAGE1',
            'KYC_REVIEWER': 'APPROVE_CASES_STAGE2',
            'AFC_REVIEWER': 'APPROVE_CASES_STAGE3',
            'ACO_REVIEWER': 'APPROVE_CASES_STAGE4'
        }[kycCase.status];

        const actionsDiv = document.querySelector('.actions');
        if (actionsDiv) {
            if (hasPermission(requiredPerm) || currentUserRole === 'ADMIN') {
                actionsDiv.style.display = 'block';
                document.getElementById('approveBtn').onclick = () => transitionCase(caseId, 'APPROVE');
                document.getElementById('rejectBtn').onclick = () => transitionCase(caseId, 'REJECT');
            } else {
                actionsDiv.style.display = 'none';
            }
        }

        // Setup Questionnaire Modal logic
        const questionnaireModal = document.getElementById('questionnaireModal');
        const openQBtn = document.getElementById('openQuestionnaireBtn');
        const closeQBtn = document.getElementById('closeQuestionnaireBtn');
        const questionnaireForm = document.getElementById('questionnaireForm');

        if (openQBtn) {
            openQBtn.onclick = () => {
                questionnaireModal.style.display = 'block';
                loadQuestionnaire(caseId);
            };
        }
        if (closeQBtn) {
            closeQBtn.onclick = () => {
                questionnaireModal.style.display = 'none';
                questionnaireForm.reset();
            };
        }

        if (questionnaireForm) {
            questionnaireForm.onsubmit = async (e) => {
                e.preventDefault();
                await saveQuestionnaire(caseId);
            };
        }

    } catch (e) {
        console.error(e);
    }
}

async function transitionCase(id, action) {
    const comment = document.getElementById('commentInput').value;
    if (!comment) return alert('Comment is required for workflow actions');

    if (action === 'APPROVE') {
        const validation = await validateQuestionnaireCompletion(id);
        if (!validation.valid) {
            if (validation.error) {
                return alert(validation.error);
            }
            return alert('Cannot forward case. The following mandatory questions are missing from the questionnaire:\n\n- ' + validation.missingQuestions.join('\n- '));
        }
    }

    try {
        const res = await fetch(`/api/cases/${id}/transition`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, comment })
        });
        if (res.ok) {
            location.reload();
        } else {
            alert('Action failed. Check permissions.');
        }
    } catch (e) {
        alert('Error performing transition');
    }
}

async function validateQuestionnaireCompletion(caseId) {
    try {
        const [templateRes, responsesRes] = await Promise.all([
            fetch('/api/questionnaire/template'),
            fetch(`/api/questionnaire/case/${caseId}`)
        ]);

        if (!templateRes.ok || !responsesRes.ok) {
            throw new Error('Failed to fetch questionnaire data for validation');
        }

        const template = await templateRes.json();
        const responses = await responsesRes.json();
        const responseMap = new Map(responses.map(r => [r.questionID, r.answerText]));

        const missingQuestions = [];

        template.forEach(section => {
            section.questions.forEach(q => {
                if (q.isMandatory) {
                    const answer = responseMap.get(q.questionID);
                    if (!answer || answer.trim() === '') {
                        missingQuestions.push(q.questionText);
                    }
                }
            });
        });

        return {
            valid: missingQuestions.length === 0,
            missingQuestions: missingQuestions
        };
    } catch (e) {
        console.error('Validation error:', e);
        return { valid: false, error: 'Could not perform questionnaire validation.' };
    }
}

async function uploadDoc(caseId, file, category, comment) {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('comment', comment);

    try {
        const res = await fetch(`/api/cases/${caseId}/documents`, {
            method: 'POST',
            body: formData
        });
        if (res.ok) {
            location.reload();
        } else {
            alert('Upload failed. Check console for details.');
        }
    } catch (e) {
        alert('Error uploading document');
    }
}

async function loadQuestionnaire(caseId) {
    const content = document.getElementById('questionnaireContent');
    content.innerHTML = '<p>Loading questionnaire...</p>';

    try {
        const [templateRes, responsesRes] = await Promise.all([
            fetch('/api/questionnaire/template'),
            fetch(`/api/questionnaire/case/${caseId}`)
        ]);

        const template = await templateRes.json();
        const responses = await responsesRes.json();

        renderQuestionnaire(template, responses);
    } catch (e) {
        console.error(e);
        content.innerHTML = '<p style="color: #ff5555;">Error loading questionnaire.</p>';
    }
}

function renderQuestionnaire(template, responses) {
    const content = document.getElementById('questionnaireContent');
    const responseMap = new Map(responses.map(r => [r.questionID, r.answerText]));

    let html = '';
    template.forEach(section => {
        html += `
            <div class="q-section" style="margin-top: 2rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem;">
                <h3 style="color: var(--primary-color); margin-bottom: 1rem;">${section.sectionName}</h3>
                <div class="q-questions">
        `;

        section.questions.forEach(q => {
            const val = responseMap.get(q.questionID) || '';
            const mandatoryAttr = q.isMandatory ? 'required' : '';
            const mandatoryLabel = q.isMandatory ? '<span style="color: #ff5555;">*</span>' : '';

            html += `
                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                        ${q.questionText} ${mandatoryLabel}
                    </label>
            `;

            if (q.questionType === 'TEXT') {
                html += `<input type="text" name="q_${q.questionID}" value="${val}" ${mandatoryAttr} style="width: 100%;" class="input">`;
            } else if (q.questionType === 'YES_NO') {
                html += `
                    <div style="display: flex; gap: 1.5rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="radio" name="q_${q.questionID}" value="Yes" ${val === 'Yes' ? 'checked' : ''} ${mandatoryAttr}> Yes
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="radio" name="q_${q.questionID}" value="No" ${val === 'No' ? 'checked' : ''} ${mandatoryAttr}> No
                        </label>
                    </div>
                `;
            } else if (q.questionType === 'MULTI_CHOICE') {
                const options = q.options.split(',').map(o => o.trim());
                html += `
                    <select name="q_${q.questionID}" ${mandatoryAttr} style="width: 100%;">
                        <option value="">-- Select Option --</option>
                        ${options.map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('')}
                    </select>
                `;
            }

            html += `</div>`;
        });

        html += `</div></div>`;
    });

    content.innerHTML = html;
}

async function saveQuestionnaire(caseId) {
    const form = document.getElementById('questionnaireForm');
    const formData = new FormData(form);
    const responses = [];

    // Map to keep track of processed question IDs (for YES_NO radios)
    const processed = new Set();

    for (let [name, value] of formData.entries()) {
        if (name.startsWith('q_')) {
            const questionID = parseInt(name.split('_')[1]);
            responses.push({
                questionID: questionID,
                answerText: value
            });
            processed.add(questionID);
        }
    }

    // Handle empty radio groups (if mandatory validation fails or optional radios)
    // Actually, HTML5 'required' on radios handles mandatory groups.
    // But we should ensure we get all values.

    try {
        const res = await fetch(`/api/questionnaire/case/${caseId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(responses)
        });

        if (res.ok) {
            alert('Questionnaire saved successfully');
            document.getElementById('questionnaireModal').style.display = 'none';
        } else {
            alert('Failed to save questionnaire');
        }
    } catch (e) {
        console.error(e);
        alert('Error saving questionnaire');
    }
}


function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// Admin Questionnaire Management

async function initAdminQuestionnaire() {
    await checkPermissions();
    if (currentUserRole !== 'ADMIN') {
        window.location.href = 'index.html';
        return;
    }
    loadAdminTemplate();

    document.getElementById('sectionForm').onsubmit = async (e) => {
        e.preventDefault();
        const section = {
            sectionID: document.getElementById('sectionID').value || null,
            sectionName: document.getElementById('sectionName').value,
            displayOrder: parseInt(document.getElementById('sectionOrder').value)
        };
        await saveAdminSection(section);
    };

    document.getElementById('questionForm').onsubmit = async (e) => {
        e.preventDefault();
        const q = {
            questionID: document.getElementById('qID').value || null,
            sectionID: parseInt(document.getElementById('qSectionID').value),
            questionText: document.getElementById('qText').value,
            questionType: document.getElementById('qType').value,
            isMandatory: document.getElementById('qMandatory').checked,
            options: document.getElementById('qOptions').value,
            displayOrder: parseInt(document.getElementById('qOrder').value)
        };
        await saveAdminQuestion(q);
    };
}

async function loadAdminTemplate() {
    const content = document.getElementById('adminContent');
    if (!content) return;
    content.innerHTML = '<p>Loading template...</p>';

    try {
        const res = await fetch('/api/questionnaire/template');
        const template = await res.json();

        let html = '';
        template.forEach(section => {
            html += `
                <div class="admin-section">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h2 style="color: var(--primary-color);">${section.sectionName} <small style="font-size: 0.6em; color: rgba(255,255,255,0.4)">#${section.sectionID} - order: ${section.displayOrder}</small></h2>
                        <div class="q-item-actions">
                            <button class="btn btn-secondary" style="padding: 0.3rem 0.6rem;" onclick="showEditSectionModal(${JSON.stringify(section).replace(/"/g, '&quot;')})">Edit</button>
                            <button class="btn" style="padding: 0.3rem 0.6rem; background: #ff5555;" onclick="deleteAdminSection(${section.sectionID})">Delete</button>
                        </div>
                    </div>
                    <div class="q-questions">
                        ${section.questions.map(q => `
                            <div class="q-item">
                                <div class="q-item-info">
                                    <strong>${q.questionText}</strong> <br>
                                    <small>${q.questionType} ${q.isMandatory ? '(Mandatory)' : ''} ${q.options ? '- Options: ' + q.options : ''} - Order: ${q.displayOrder}</small>
                                </div>
                                <div class="q-item-actions">
                                    <button class="btn btn-secondary" style="padding: 0.2rem 0.4rem;" onclick="showEditQuestionModal(${JSON.stringify(q).replace(/"/g, '&quot;')})">Edit</button>
                                    <button class="btn" style="padding: 0.2rem 0.4rem; background: #ff5555;" onclick="deleteAdminQuestion(${q.questionID})">Delete</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-top: 1rem; text-align: right;">
                        <button class="btn btn-secondary" onclick="showAddQuestionModal(${section.sectionID})">+ Add Question</button>
                    </div>
                </div>
            `;
        });
        content.innerHTML = html || '<p>No sections defined yet.</p>';
    } catch (e) {
        content.innerHTML = '<p class="error">Error loading template.</p>';
    }
}

async function saveAdminSection(section) {
    try {
        const res = await fetch('/api/questionnaire/template/section', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(section)
        });
        if (res.ok) {
            closeModal('sectionModal');
            loadAdminTemplate();
        } else { alert('Save failed'); }
    } catch (e) { alert('Error: ' + e.message); }
}

async function deleteAdminSection(id) {
    if (!confirm('Are you sure? This will delete all questions in this section.')) return;
    try {
        const res = await fetch(`/api/questionnaire/template/section/${id}`, { method: 'DELETE' });
        if (res.ok) loadAdminTemplate();
    } catch (e) { alert('Error deleting section'); }
}

async function saveAdminQuestion(q) {
    try {
        const res = await fetch('/api/questionnaire/template/question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(q)
        });
        if (res.ok) {
            closeModal('questionModal');
            loadAdminTemplate();
        } else { alert('Save failed'); }
    } catch (e) { alert('Error: ' + e.message); }
}

async function deleteAdminQuestion(id) {
    if (!confirm('Are you sure?')) return;
    try {
        const res = await fetch(`/api/questionnaire/template/question/${id}`, { method: 'DELETE' });
        if (res.ok) loadAdminTemplate();
    } catch (e) { alert('Error deleting question'); }
}

function showAddSectionModal() {
    document.getElementById('sectionModalTitle').textContent = 'Add Section';
    document.getElementById('sectionID').value = '';
    document.getElementById('sectionForm').reset();
    document.getElementById('sectionModal').style.display = 'block';
}

function showEditSectionModal(section) {
    document.getElementById('sectionModalTitle').textContent = 'Edit Section';
    document.getElementById('sectionID').value = section.sectionID;
    document.getElementById('sectionName').value = section.sectionName;
    document.getElementById('sectionOrder').value = section.displayOrder;
    document.getElementById('sectionModal').style.display = 'block';
}

function showAddQuestionModal(sectionID) {
    document.getElementById('questionModalTitle').textContent = 'Add Question';
    document.getElementById('qID').value = '';
    document.getElementById('qSectionID').value = sectionID;
    document.getElementById('questionForm').reset();
    toggleOptions();
    document.getElementById('questionModal').style.display = 'block';
}

function showEditQuestionModal(q) {
    document.getElementById('questionModalTitle').textContent = 'Edit Question';
    document.getElementById('qID').value = q.questionID;
    document.getElementById('qSectionID').value = q.sectionID;
    document.getElementById('qText').value = q.questionText;
    document.getElementById('qType').value = q.questionType;
    document.getElementById('qOptions').value = q.options || '';
    document.getElementById('qMandatory').checked = q.isMandatory;
    document.getElementById('qOrder').value = q.displayOrder;
    toggleOptions();
    document.getElementById('questionModal').style.display = 'block';
}

function toggleOptions() {
    const typeField = document.getElementById('qType');
    if (!typeField) return;
    const type = typeField.value;
    document.getElementById('optionsGroup').style.display = (type === 'MULTI_CHOICE') ? 'block' : 'none';
}

function showCreateCaseModal(clientID) {
    const modal = document.getElementById('createCaseModal');
    if (modal) {
        // Clear previous state if any
        const reasonField = document.getElementById('caseReason');
        if (reasonField) reasonField.value = '';

        // Store clientID in a way saveCase can access it
        modal.dataset.clientId = clientID;
        modal.style.display = 'block';
    }
}

async function saveCase() {
    const modal = document.getElementById('createCaseModal');
    const clientID = modal.dataset.clientId;
    const reason = document.getElementById('caseReason').value;

    if (!reason) {
        alert('Please provide a reason for the case');
        return;
    }

    try {
        const res = await fetch('/api/cases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientID, reason })
        });
        if (res.ok) {
            const caseId = await res.json();
            window.location.href = `case-details.html?id=${caseId}`;
        } else {
            alert('Failed to create case');
        }
    } catch (e) {
        console.error(e);
        alert('Error creating case');
    }
}

/**
 * Formats complex client data (nested arrays) into readable strings for Excel export
 * @param {Array} clients - Array of client objects
 * @returns {Array} Array of flattened client objects
 */
function flattenClientData(clients) {
    return clients.map(client => {
        const flat = { ...client };

        // Flatten Addresses
        if (Array.isArray(client.addresses)) {
            flat.addresses = client.addresses.map(a =>
                `${a.addressType}: ${a.addressLine1}${a.addressLine2 ? ', ' + a.addressLine2 : ''}, ${a.city}, ${a.country}`
            ).join('; ');
        } else {
            flat.addresses = '-';
        }

        // Flatten Identifiers
        if (Array.isArray(client.identifiers)) {
            flat.identifiers = client.identifiers.map(i =>
                `${i.identifierType}: ${i.identifierValue}${i.identifierNumber ? ' (No: ' + i.identifierNumber + ')' : ''} [${i.issuingAuthority}]`
            ).join('; ');
        } else {
            flat.identifiers = '-';
        }

        // Flatten Related Parties
        if (Array.isArray(client.relatedParties)) {
            flat.relatedParties = client.relatedParties.map(p =>
                `${p.relationType}: ${p.firstName} ${p.lastName} (${p.status})`
            ).join('; ');
        } else {
            flat.relatedParties = '-';
        }

        // Flatten Accounts
        if (Array.isArray(client.accounts)) {
            flat.accounts = client.accounts.map(acc =>
                `${acc.accountNumber} (${acc.accountStatus})`
            ).join('; ');
        } else {
            flat.accounts = '-';
        }

        return flat;
    });
}

/**
 * Utility function to export data to Excel using SheetJS
 * @param {Array} data - Array of objects to export
 * @param {string} filename - The name of the file to download
 */
function exportToExcel(data, filename) {
    if (!data || data.length === 0) {
        alert('No data available to export');
        return;
    }

    try {
        let processedData = data;

        // If it's client data, flatten the nested arrays first
        if (filename.toLowerCase().includes('client')) {
            processedData = flattenClientData(data);
        }

        // Create a new workbook
        const wb = XLSX.utils.book_new();

        // Convert JSON data to worksheet
        const ws = XLSX.utils.json_to_sheet(processedData);

        // Append worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Data");

        // Export the workbook
        XLSX.writeFile(wb, filename);
    } catch (error) {
        console.error('Excel Export Error:', error);
        alert('Failed to export Excel: ' + error.message);
    }
}
