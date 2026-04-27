const API_URL = 'https://script.google.com/macros/s/AKfycbw0QeY-Oi7wF7k9pHqkabmaDlrrg5UuDMqEV2KlNAL96pap4Q0dRTiGxSx1WSkzRX-h/exec'; // PON AQUÍ TU URL

// Cargar cuando inicia
window.onload = function() {
    loadGrades();
    
    document.getElementById('gradeForm').onsubmit = async function(e) {
        e.preventDefault();
        
        const data = {
            action: 'addGrade',
            studentName: document.getElementById('studentName').value,
            subject: document.getElementById('subjectSelect').value,
            period: document.getElementById('periodSelect').value,
            grade: document.getElementById('grade').value,
            observations: document.getElementById('observations').value,
            date: new Date().toLocaleDateString()
        };
        
        const params = new URLSearchParams(data).toString();
        
        try {
            const response = await fetch(API_URL + '?' + params);
            const result = await response.json();
            
            if (result.success) {
                alert('✅ Calificación guardada');
                document.getElementById('gradeForm').reset();
                loadGrades();
            }
        } catch (error) {
            alert('Error: ' + error);
        }
    };
};

async function loadGrades() {
    try {
        const response = await fetch(API_URL + '?action=getGrades');
        const data = await response.json();
        
        console.log('Datos recibidos:', data); // Ver en consola
        
        displayGrades(data.grades);
        updateStats(data.grades);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('gradesTableBody').innerHTML = 
            '<tr><td colspan="6">Error al cargar datos</td></tr>';
    }
}

function displayGrades(grades) {
    const tbody = document.getElementById('gradesTableBody');
    
    if (!grades || grades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No hay calificaciones</td></tr>';
        return;
    }
    
    let html = '';
    
    for (let i = 0; i < grades.length; i++) {
        const g = grades[i];
        const grade = parseFloat(g.grade) || 0;
        
        let status, color;
        if (grade >= 70) {
            status = 'Aprobado';
            color = 'green';
        } else if (grade >= 50) {
            status = 'Regular';
            color = 'orange';
        } else {
            status = 'En Riesgo';
            color = 'red';
        }
        
        html += `
            <tr>
                <td>${g.studentName || ''}</td>
                <td>${g.subject || ''}</td>
                <td>${g.period || ''}</td>
                <td style="color: ${color}; font-weight: bold;">${grade}</td>
                <td><span style="background: ${color}; color: white; padding: 3px 8px; border-radius: 10px;">${status}</span></td>
                <td>
                    <button onclick="deleteGrade(${g.rowIndex})" style="background: red; color: white; border: none; padding: 5px 10px; border-radius: 5px;">
                        Eliminar
                    </button>
                </td>
            </tr>
        `;
    }
    
    tbody.innerHTML = html;
}

function updateStats(grades) {
    if (!grades || grades.length === 0) {
        document.getElementById('totalStudents').textContent = '0';
        document.getElementById('averageGrade').textContent = '0';
        document.getElementById('approvedCount').textContent = '0';
        document.getElementById('failedCount').textContent = '0';
        return;
    }
    
    const values = grades.map(g => parseFloat(g.grade) || 0);
    const total = values.length;
    const avg = values.reduce((a, b) => a + b, 0) / total;
    const approved = values.filter(v => v >= 70).length;
    const failed = values.filter(v => v < 50).length;
    
    document.getElementById('totalStudents').textContent = total;
    document.getElementById('averageGrade').textContent = avg.toFixed(1);
    document.getElementById('approvedCount').textContent = approved;
    document.getElementById('failedCount').textContent = failed;
}

async function deleteGrade(rowIndex) {
    if (!confirm('¿Eliminar esta calificación?')) return;
    
    try {
        const response = await fetch(API_URL + '?action=deleteGrade&rowIndex=' + rowIndex);
        const data = await response.json();
        
        if (data.success) {
            loadGrades();
        }
    } catch (error) {
        alert('Error al eliminar');
    }
}
