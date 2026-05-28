// ======================================================
// FIREBASE IMPORTS
// ======================================================

import {
initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";

import {
getFirestore,
collection,
getDocs,
addDoc,
doc,
updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ======================================================
// FIREBASE CONFIG
// ======================================================

const firebaseConfig = {

```
apiKey: "AIzaSyBqbdmDKe6x_nWzkm6OwOX19QyJgCb7arM",

authDomain: "cmfilings-firebase.firebaseapp.com",

projectId: "cmfilings-firebase",

storageBucket: "cmfilings-firebase.firebasestorage.app",

messagingSenderId: "55459718043",

appId: "1:55459718043:web:054cbd500c00ebf3cd373e"
```

};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

// ======================================================
// GOOGLE SCRIPT
// ======================================================

const googleAppsScriptURL =
"YOUR_DEPLOYED_SCRIPT_URL";

// ======================================================
// DATABASES
// ======================================================

let clientsDatabase = [];

let compliancesDatabase = [];

let credentialsDatabase = [];

let donutChartInstance = null;

let plChartInstance = null;

let globalSearchKeyword = "";

// ======================================================
// NAVIGATION
// ======================================================

window.switchLocalTab = function(tabName) {

```
document
.querySelectorAll('.view-container')
.forEach(el => el.classList.remove('active'));

document
.querySelectorAll('.menu-item')
.forEach(el => el.classList.remove('active'));

const targetView =
document.getElementById(`view-${tabName}`);

if(targetView) {

    targetView.classList.add('active');
}

const nav =
document.getElementById(`nav-${tabName}`);

if(nav) {

    nav.classList.add('active');
}

const titleMap = {

    dashboard: 'Dashboard Overview',

    clients: 'Clients Directory',

    compliances: 'Compliance Monitor',

    credentials: 'Credentials Vault'
};

const pageTitle =
document.getElementById('pageTitle');

if(pageTitle) {

    pageTitle.innerText =
    titleMap[tabName] || "Overview";
}

runLocalTableRenderFilters();
```

};

// ======================================================
// CHARTS
// ======================================================

function renderCharts(pendingCount, completedCount) {

```
const donutCanvas =
document.getElementById('complianceDonutChart');

if(donutCanvas) {

    if(donutChartInstance) {

        donutChartInstance.destroy();
    }

    donutChartInstance =
    new Chart(donutCanvas.getContext('2d'), {

        type: 'doughnut',

        data: {

            labels: [

                'Pending',

                'Completed'

            ],

            datasets: [{

                data: [

                    pendingCount,

                    completedCount

                ],

                backgroundColor: [

                    '#ef4444',

                    '#10b981'

                ],

                borderWidth: 2
            }]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            cutout: '70%'
        }
    });
}


const lineCanvas =
document.getElementById('plChart');

if(lineCanvas) {

    if(plChartInstance) {

        plChartInstance.destroy();
    }

    plChartInstance =
    new Chart(lineCanvas.getContext('2d'), {

        type: 'line',

        data: {

            labels: [

                'Jan',

                'Feb',

                'Mar',

                'Apr',

                'May',

                'Jun'

            ],

            datasets: [{

                label: 'Income',

                data: [

                    12000,

                    18000,

                    15000,

                    22000,

                    26000,

                    31000

                ],

                borderColor: '#10b981',

                backgroundColor:
                'rgba(16,185,129,0.08)',

                fill: true,

                tension: 0.3
            }]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false
        }
    });
}
```

}

// ======================================================
// FETCH DATABASE
// ======================================================

async function runGlobalSystemFetchIngress() {

```
try {

    const [

        clientsSnap,

        compliancesSnap,

        credentialsSnap

    ] = await Promise.all([

        getDocs(collection(db, "CLIENTS")),

        getDocs(collection(db, "COMPLIANCES")),

        getDocs(collection(db, "CREDENTIALS"))

    ]);


    // CLIENTS

    clientsDatabase = [];

    clientsSnap.forEach(doc => {

        clientsDatabase.push({

            id: doc.id,

            ...doc.data()
        });
    });


    // COMPLIANCES

    compliancesDatabase = [];

    let pendingCount = 0;

    let completedCount = 0;

    compliancesSnap.forEach(doc => {

        const data = doc.data();

        compliancesDatabase.push({

            id: doc.id,

            ...data
        });

        if(
            (data.TaskStatus || "")
            .toLowerCase() === "completed"
        ) {

            completedCount++;

        } else {

            pendingCount++;
        }
    });


    // CREDENTIALS

    credentialsDatabase = [];

    credentialsSnap.forEach(doc => {

        credentialsDatabase.push({

            id: doc.id,

            ...doc.data()
        });
    });


    // COUNTS

    const c1 =
    document.getElementById('totalClientsCount');

    if(c1) c1.innerText =
    clientsDatabase.length;


    const c2 =
    document.getElementById('totalComplianceCount');

    if(c2) c2.innerText =
    compliancesDatabase.length;


    const c3 =
    document.getElementById('totalCredentialCount');

    if(c3) c3.innerText =
    credentialsDatabase.length;


    renderCharts(
        pendingCount,
        completedCount
    );

    runLocalTableRenderFilters();

} catch(error) {

    console.error(error);

    alert(
        "Database connection failed."
    );
}
```

}

// ======================================================
// TABLE RENDERING
// ======================================================

window.runLocalTableRenderFilters = function() {

```
const keyword =
globalSearchKeyword.toLowerCase();


// ==================================================
// CLIENTS
// ==================================================

const clientBody =
document.getElementById('clientsTableBody');

if(clientBody) {

    let html = '';

    clientsDatabase
    .filter(row => {

        return !keyword ||

        (row.ClientName || '')
        .toLowerCase()
        .includes(keyword) ||

        (row.ClientID || '')
        .toLowerCase()
        .includes(keyword) ||

        (row.GSTNo || '')
        .toLowerCase()
        .includes(keyword);
    })

    .forEach(row => {

        html += `

        <tr>

            <td>${row.ClientID || '-'}</td>

            <td class="client-name-cell">
                ${row.ClientName || '-'}
            </td>

            <td>${row.MobileNo || '-'}</td>

            <td>${row.Constitution || '-'}</td>

        </tr>
        `;
    });

    clientBody.innerHTML = html;
}


// ==================================================
// COMPLIANCES
// ==================================================

const compBody =
document.getElementById('compliancesTableBody');

if(compBody) {

    let html = '';

    compliancesDatabase
    .filter(row => {

        return !keyword ||

        (row.ClientName || '')
        .toLowerCase()
        .includes(keyword);
    })

    .forEach(row => {

        const status =
        row.TaskStatus || "Pending";

        const color =
        status.toLowerCase() === 'completed'
        ? '#10b981'
        : '#ef4444';

        html += `

        <tr>

            <td>${row.TaskID || '-'}</td>

            <td>${row.ClientName || '-'}</td>

            <td>${row.Task || '-'}</td>

            <td>${row.DueDate || '-'}</td>

            <td
                style="
                color:${color};
                font-weight:600;
                ">

                ${status}

            </td>

        </tr>
        `;
    });

    compBody.innerHTML = html;
}


// ==================================================
// CREDENTIALS
// ==================================================

const credBody =
document.getElementById('credentialsTableBody');

if(credBody) {

    let html = '';

    credentialsDatabase
    .filter(row => {

        return !keyword ||

        (row.ClientName || '')
        .toLowerCase()
        .includes(keyword);
    })

    .forEach(row => {

        html += `

        <tr>

            <td>${row.CredentialID || '-'}</td>

            <td>${row.ClientName || '-'}</td>

            <td>${row.PortalName || '-'}</td>

            <td>${row.UserName || '-'}</td>

            <td>••••••••</td>

        </tr>
        `;
    });

    credBody.innerHTML = html;
}
```

};

// ======================================================
// SAVE CLIENT
// ======================================================

window.submitClient = async function() {

```
const clientData = {

    ClientID:
    document.getElementById('add-clientid').value,

    ClientName:
    document.getElementById('add-clientname').value,

    MobileNo:
    document.getElementById('add-mobileno').value,

    FolderLink:
    document.getElementById('add-folderlink').value,

    Email:
    document.getElementById('add-email').value,

    Branch:
    document.getElementById('add-branch').value,

    Constitution:
    document.getElementById('add-constitution').value,

    GSTNo:
    document.getElementById('add-gstno').value,

    PanNo:
    document.getElementById('add-panno').value,

    AdharNo:
    document.getElementById('add-adharno').value,

    FathersName:
    document.getElementById('add-fathersname').value,

    'DOB/DOC':
    document.getElementById('add-dob').value,

    Address:
    document.getElementById('add-address').value,

    Reference:
    document.getElementById('add-reference').value,

    Notes:
    document.getElementById('add-notes').value
};


try {

    await addDoc(
        collection(db, "CLIENTS"),
        clientData
    );


    if(
        googleAppsScriptURL !==
        "YOUR_DEPLOYED_SCRIPT_URL"
    ) {

        await fetch(
            googleAppsScriptURL,
        {

            method: 'POST',

            headers: {

                'Content-Type':
                'application/json'
            },

            body: JSON.stringify({

                action: "CREATE",

                sheetTarget: "CLIENTS",

                primaryKeyColumn: "ClientID",

                data: clientData
            })
        });
    }

    alert("Client saved.");

    runGlobalSystemFetchIngress();

} catch(error) {

    console.error(error);

    alert(error.message);
}
```

};

// ======================================================
// SEARCH
// ======================================================

window.addEventListener('DOMContentLoaded', () => {

```
runGlobalSystemFetchIngress();

const searchInput =
document.getElementById(
    'dashboardMasterSearch'
);

if(searchInput) {

    searchInput
    .addEventListener('input', (e) => {

        globalSearchKeyword =
        e.target.value;

        runLocalTableRenderFilters();
    });
}


// DARK MODE

const themeBtn =
document.getElementById(
    'themeToggleBtn'
);

if(themeBtn) {

    themeBtn
    .addEventListener('click', () => {

        const icon =
        themeBtn.querySelector('i');

        if(
            document.body
            .getAttribute('data-theme')
            === 'dark'
        ) {

            document.body
            .removeAttribute('data-theme');

            icon.className =
            'fa-solid fa-moon';

        } else {

            document.body
            .setAttribute(
                'data-theme',
                'dark'
            );

            icon.className =
            'fa-solid fa-sun';
        }
    });
}
```

});
