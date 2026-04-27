// Configuración
const API_URL = 'https://script.google.com/macros/s/AKfycbwE5V93znMxOx2NVyfuG-WK29Xvf7LyvioHcbmMXMIGjHTRTN9gBmLR6SC0mQp7kiZN/exec'; // ← Pega aquí tu URL
let deferredPrompt;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadGrades();
    setupEventListeners();
    registerServiceWorker();
});

// Event Listeners
function setupEventListeners() {
    document.getElementById('gradeForm').addEventListener('submit', handleSubmit);
    
    // PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        document.getElementById('installPrompt').style.display = 'block';
    });
}

// Cargar calificaciones
async function loadGrades() {
    showLoading();
    
    try {
        const response = await fetch(`${API_URL}?action=getGrades`);
        const data = await response.json();
        
        if (data.grades) {
            renderGrades(data.grades);
            updateStatistics(data.grades);
        }
    } catch (error) {
        showError('Error al cargar calificaciones');
    }
}

// Guardar calificación
async function handleSubmit(e) {
    e.preventDefault();
    
    const formData = {
        action: 'addGrade',
        studentName: document.getElementById('studentName').value,
        subject: document.getElementById('subjectSelect').value,
        period: document.getElementById('periodSelect').value,
        grade: document.getElementById('grade').value,
        observations: document.getElementById('observations').value,
        date: new Date().toISOString()
    };
    
    try {
        const queryString = Object.entries(formData)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');
        
        const response = await fetch(`${API_URL}?${queryString}`);
        const data = await response.json();
        
        if (data.success) {
            showNotification('✅ Calificación guardada exitosamente');
            document.getElementById('gradeForm').reset();
            loadGrades();
        } else {
            showError(data.error || 'Error al guardar');
        }
    } catch (error) {
        showError('Error de conexión');
    }
}

// Eliminar calificación
async function deleteGrade(rowIndex) {
    if (!confirm('¿Estás seguro de eliminar esta calificación?')) return;
    
    try {
        const response = await fetch(`${API_URL}?action=deleteGrade&rowIndex=${rowIndex}`);
        const data = await response.json();
        
        if (data.success) {
            showNotification('🗑️ Calificación eliminada');
            loadGrades();
        }
    } catch (error) {
        showError('Error al eliminar');
    }
}

// Renderizar tabla
function renderGrades(grades) {
    const tbody = document.getElementById('gradesTableBody');
    
    if (grades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No hay calificaciones registradas</td></tr>';
        return;
    }
    
    tbody.innerHTML = grades.map(grade => {
        const gradeValue = parseFloat(grade.grade);
        let status = '';
        let badgeClass = '';
        
        if (gradeValue >= 70) {
            status = 'Aprobado';
            badgeClass = 'badge-success';
        } else if (gradeValue >= 50) {
            status = 'Regular';
            badgeClass = 'badge-warning';
        } else {
            status = 'En Riesgo';
            badgeClass = 'badge-danger';
        }
        
        return `
            <tr>
                <td><strong>${grade.studentName}</strong></td>
                <td>${grade.subject}</td>
                <td>${grade.period}</td>
                <td><strong>${gradeValue.toFixed(1)}</strong></td>
                <td><span class="badge ${badgeClass}">${status}</span></td>
                <td>
                    <button class="btn btn-danger" onclick="deleteGrade(${grade.rowIndex})">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Actualizar estadísticas
function updateStatistics(grades) {
    if (grades.length === 0) {
        document.getElementById('totalStudents').textContent = '0';
        document.getElementById('averageGrade').textContent = '0';
        document.getElementById('approvedCount').textContent = '0';
        document.getElementById('failedCount').textContent = '0';
        return;
    }
    
    const gradeValues = grades.map(g => parseFloat(g.grade));
    const total = grades.length;
    const average = gradeValues.reduce((a, b) => a + b, 0) / total;
    const approved = gradeValues.filter(g => g >= 70).length;
    const failed = gradeValues.filter(g => g < 50).length;
    
    document.getElementById('totalStudents').textContent = total;
    document.getElementById('averageGrade').textContent = average.toFixed(1);
    document.getElementById('approvedCount').textContent = approved;
    document.getElementById('failedCount').textContent = failed;
}

// Utilidades
function showLoading() {
    document.getElementById('gradesTableBody').innerHTML = '<tr><td colspan="6" style="text-align:center;"><div class="spinner"></div></td></tr>';
}

function showError(message) {
    alert('Error: ' + message);
}

function showNotification(message) {
    // Notificación simple (puedes mejorar con Toast)
    alert(message);
}

// PWA Installation
function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((result) => {
            if (result.outcome === 'accepted') {
                console.log('App instalada');
            }
            deferredPrompt = null;
            document.getElementById('installPrompt').style.display = 'none';
        });
    }
}

// Service Worker para modo offline
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('service-worker.js');
            console.log('Service Worker registrado');
        } catch (error) {
            console.log('Service Worker no registrado:', error);
        }
    }
}
