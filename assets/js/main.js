(function(){
    // Render doctor cards on doctors.html
    window.renderDoctorCards = function(filter = {}) {
        const container = document.getElementById('doctorsContainer');
        if (!container) return;
        let doctors = window.DocPocData.doctors;
        // apply filters (specialty, city, availableToday)
        if (filter.specialty) doctors = doctors.filter(d => d.specialty === filter.specialty);
        if (filter.city) doctors = doctors.filter(d => d.city === filter.city);
        if (filter.availableToday) doctors = doctors.filter(d => d.availableToday);
        document.getElementById('resultCount').textContent = doctors.length;
        container.innerHTML = doctors.map(doc => `
            <div class="bg-white rounded-2xl shadow-sm border p-5 hover:shadow-md transition">
                <div class="flex gap-4">
                    <img src="${doc.image}" class="w-16 h-16 rounded-full object-cover">
                    <div>
                        <h3 class="font-bold">${doc.name}</h3>
                        <p class="text-primary text-sm">${doc.specialty}</p>
                        <div class="flex items-center text-yellow-500 text-sm">${'★'.repeat(Math.floor(doc.rating))}${doc.rating%1? '½':''} <span class="text-gray-500 ml-1">(${doc.reviews})</span></div>
                    </div>
                </div>
                <div class="mt-3 text-sm text-gray-500"><i class="fas fa-map-pin w-4"></i> ${doc.city}</div>
                <a href="doctor-profile.html?id=${doc.id}" class="mt-4 block text-center bg-primary/10 text-primary font-semibold py-2.5 rounded-xl hover:bg-primary hover:text-white">View profile & book</a>
            </div>
        `).join('');
    };

    // Render doctor profile
    window.renderDoctorProfile = function(id) {
        const doctor = window.DocPocData.doctors.find(d => d.id == id);
        const container = document.getElementById('profileContent');
        if (!doctor) { container.innerHTML = '<p>Doctor not found</p>'; return; }
        // Generate availability slots (mock)
        const slots = ['09:00', '10:30', '14:00', '16:30'];
        container.innerHTML = `
            <div class="flex flex-col md:flex-row gap-8">
                <div class="md:w-1/3"><img src="${doctor.image}" class="w-full rounded-2xl"></div>
                <div class="md:w-2/3">
                    <h2 class="text-3xl font-bold">${doctor.name}</h2>
                    <p class="text-primary text-lg">${doctor.specialty}</p>
                    <div class="flex items-center mt-2">${'★'.repeat(Math.floor(doctor.rating))} <span class="text-gray-600 ml-2">${doctor.reviews} reviews</span></div>
                    <p class="mt-4"><i class="fas fa-map-marker-alt"></i> ${doctor.city}</p>
                    <h3 class="font-semibold mt-6 mb-3">Available time slots</h3>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        ${slots.map(slot => `<button onclick="openBookingModal('${doctor.name}', '${slot}')" class="border border-primary/40 text-primary rounded-lg py-2 px-3 hover:bg-primary hover:text-white">${slot}</button>`).join('')}
                    </div>
                </div>
            </div>
        `;
    };

    // Booking modal functions
    window.openBookingModal = function(docName, time) {
        document.getElementById('modalDetails').innerHTML = `<p class="font-medium">${docName}</p><p>${time} • In-person</p>`;
        document.getElementById('bookingModal').classList.remove('hidden');
    };
    window.closeBookingModal = () => document.getElementById('bookingModal').classList.add('hidden');
    window.confirmBooking = () => {
        alert('Appointment confirmed! (Demo)');
        closeBookingModal();
        // could add to mock appointments
    };

    // Appointments page render
    window.renderAppointments = function() {
        const upcoming = window.DocPocData.appointments.filter(a => a.status === 'upcoming');
        const past = window.DocPocData.appointments.filter(a => a.status === 'past');
        const upcomingList = document.getElementById('upcomingList');
        const pastList = document.getElementById('pastList');
        upcomingList.innerHTML = upcoming.map(apt => {
            const doc = window.DocPocData.doctors.find(d => d.id === apt.doctorId);
            return `<div class="bg-white p-4 rounded-xl border flex justify-between items-center"><div><p class="font-bold">${doc.name}</p><p class="text-sm text-gray-500">${apt.date} at ${apt.time} • ${apt.type}</p></div><button class="text-primary text-sm">Manage</button></div>`;
        }).join('') || '<p class="text-gray-500">No upcoming appointments</p>';
        pastList.innerHTML = past.map(apt => { /* similar */ }).join('');
    };

    // Teleconsult render
    window.renderTeleconsult = function() {
        const teleDoctors = window.DocPocData.doctors.filter(d => d.teleconsult);
        const container = document.getElementById('teleDoctorsContainer');
        container.innerHTML = teleDoctors.map(doc => `
            <div class="bg-white rounded-2xl p-5 border shadow-sm">
                <div class="flex items-center gap-3"><i class="fas fa-video text-primary"></i><span class="font-bold">${doc.name}</span></div>
                <p class="text-sm">${doc.specialty}</p>
                <button onclick="openBookingModal('${doc.name} (Teleconsult)', 'Video call')" class="mt-4 w-full bg-primary text-white py-2 rounded-xl">Book video</button>
            </div>
        `).join('');
    };

    // Attach filter listeners for doctors page
    document.addEventListener('DOMContentLoaded', () => {
        const applyBtn = document.getElementById('applyFilters');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const specialty = document.getElementById('specialtyFilter')?.value;
                const city = document.getElementById('cityFilter')?.value;
                const today = document.getElementById('availableToday')?.checked;
                window.renderDoctorCards({ specialty, city, availableToday: today });
            });
            document.getElementById('resetFilters')?.addEventListener('click', () => {
                document.getElementById('specialtyFilter').value = '';
                document.getElementById('cityFilter').value = '';
                document.getElementById('availableToday').checked = false;
                window.renderDoctorCards();
            });
        }
        // Login state mock
        if (localStorage.getItem('docpoc_user')) {
            const loginBtn = document.querySelector('a[href="login.html"]');
            if(loginBtn) loginBtn.textContent = 'Account';
        }
    });
})();