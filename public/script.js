document.addEventListener('DOMContentLoaded', () => {
    const studentForm = document.getElementById('studentForm');
    const activeStudentsTable = document.getElementById('activeStudentsTable').getElementsByTagName('tbody')[0];
    const dueStudentsTable = document.getElementById('dueStudentsTable').getElementsByTagName('tbody')[0];
    const allStudentsTable = document.getElementById('allStudentsTable').getElementsByTagName('tbody')[0];

    const API_URL = 'http://localhost:3000/students';

    fetchStudents();

    // --- In script.js ---

studentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const startDate = document.getElementById('startDate').value;
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // The object that gets sent to the server
    const studentData = {
        name: document.getElementById('name').value,
        aadhar: document.getElementById('aadhar').value,
        address: document.getElementById('address').value,
        mobile: document.getElementById('mobile').value,
        startDate: startDate,
        endDate: endDate.toISOString().split('T')[0],
        monthsPaid: 1 // <-- ADD THIS LINE
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData),
        });
        if (response.ok) {
            studentForm.reset();
            fetchStudents();
        } else {
            console.error('Failed to add student'); // This is what you were seeing
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

    async function fetchStudents() {
        try {
            const response = await fetch(API_URL);
            const students = await response.json();
            activeStudentsTable.innerHTML = '';
            dueStudentsTable.innerHTML = '';
            allStudentsTable.innerHTML = '';
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            students.forEach(student => {
                // CHANGE 4: Add the 'monthsPaid' data to the All Students table row
                const allRow = allStudentsTable.insertRow();
                allRow.innerHTML = `
                    <td>${student.name}</td>
                    <td>${student.aadhar}</td>
                    <td>${student.address}</td>
                    <td>${student.mobile}</td>
                    <td>${student.startDate}</td>
                    <td>${student.endDate}</td>
                    <td>${student.monthsPaid}</td>
                    <td><button class="delete-btn" data-id="${student.id}">Delete</button></td>
                `;

                const endDate = new Date(student.endDate);
                if (endDate >= today) {
                    const row = activeStudentsTable.insertRow();
                    row.innerHTML = `
                        <td>${student.name}</td>
                        <td>${student.mobile}</td>
                        <td>${student.endDate}</td>
                        <td><button class="delete-btn" data-id="${student.id}">Delete</button></td>
                    `;
                } else {
                    // CHANGE 5: Replace the 'Renew' button with an input and a 'Submit Fee' button
                    const row = dueStudentsTable.insertRow();
                    row.innerHTML = `
                        <td>${student.name}</td>
                        <td>${student.mobile}</td>
                        <td>${student.endDate}</td>
                        <td class="fee-submission-cell">
                            <input type="number" class="months-input" placeholder="Months" min="1" value="1">
                            <button class="submit-fee-btn" data-id="${student.id}">Submit Fee</button>
                            <button class="delete-btn" data-id="${student.id}">Delete</button>
                        </td>
                    `;
                }
            });
            addActionListeners();
        } catch (error) { console.error('Error fetching students:', error); }
    }

    function addActionListeners() {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const studentId = e.target.getAttribute('data-id');
                deleteStudent(studentId);
            });
        });

        // CHANGE 6: Add listener for the new 'Submit Fee' button
        document.querySelectorAll('.submit-fee-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const studentId = e.target.getAttribute('data-id');
                // Find the input field related to this button
                const monthsInput = e.target.previousElementSibling;
                const monthsToRenew = monthsInput.value;
                renewSubscription(studentId, monthsToRenew);
            });
        });
    }

    async function deleteStudent(id) {
        if (!confirm('Are you sure you want to delete this student record?')) return;
        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            if (response.ok) { fetchStudents(); } 
            else { console.error('Failed to delete student'); }
        } catch (error) { console.error('Error:', error); }
    }

    // CHANGE 7: Update function to send the number of months to the server
    async function renewSubscription(id, monthsToRenew) {
        if (!monthsToRenew || parseInt(monthsToRenew, 10) < 1) {
            alert('Please enter a valid number of months.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/${id}/renew`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ monthsToRenew: monthsToRenew }),
            });

            if (response.ok) {
                fetchStudents();
            } else {
                console.error('Failed to renew subscription');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
});