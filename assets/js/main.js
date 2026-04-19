(function(){
    // ---------- AUTH UI UPDATE ----------
    function updateAuthUI() {
    const token = localStorage.getItem("token");
    console.log("Token exists:", !!token); // Debug log

    // Find all login/signup links (multiple possible selectors)
    const loginLinks = document.querySelectorAll('a[href="login.html"], a[href="/login.html"]');
    const signupLinks = document.querySelectorAll('a[href="Sign_up.html"], a[href="/Sign_up.html"], a[href="signup.html"]');

    if (token) {
        // Hide all login/signup links
        loginLinks.forEach(link => link.style.display = 'none');
        signupLinks.forEach(link => link.style.display = 'none');

        // Add logout button if not already present
        if (!document.getElementById('logoutNavBtn')) {
            const nav = document.querySelector('nav, .navbar, .nav-links, header nav');
            if (nav) {
                const logoutBtn = document.createElement('a');
                logoutBtn.href = '#';
                logoutBtn.id = 'logoutNavBtn';
                logoutBtn.className = 'nav-link text-gray-700 hover:text-primary ml-4';
                logoutBtn.textContent = 'Logout';
                logoutBtn.style.cursor = 'pointer';
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem('token');
                    localStorage.removeItem('userId');
                    window.location.reload();
                });
                nav.appendChild(logoutBtn);
                console.log("Logout button added"); // Debug log
            } else {
                console.warn("Nav container not found for logout button");
            }
        }
    } else {
        // Show login/signup links
        loginLinks.forEach(link => link.style.display = '');
        signupLinks.forEach(link => link.style.display = '');
        // Remove logout button if exists
        const logoutBtn = document.getElementById('logoutNavBtn');
        if (logoutBtn) logoutBtn.remove();
    }
}

    // ---------- DOCTORS LIST (Real API) ----------
    window.fetchAndRenderDoctors = async function(filter = {}) {
        const container = document.getElementById('doctorsContainer');
        if (!container) return;

        try {
            const res = await fetch('/api/doctors');
            if (!res.ok) throw new Error('Failed to fetch doctors');
            let doctors = await res.json();

            // Apply client-side filters (or send query params to backend)
            if (filter.specialty) doctors = doctors.filter(d => d.specialty === filter.specialty);
            if (filter.city) doctors = doctors.filter(d => d.city === filter.city);
            if (filter.availableToday) doctors = doctors.filter(d => d.available_today == 1);

            const countSpan = document.getElementById('resultCount');
            if (countSpan) countSpan.textContent = doctors.length;

            container.innerHTML = doctors.map(doc => `
                <div class="bg-white rounded-2xl shadow-sm border p-5 hover:shadow-md transition">
                    <div class="flex gap-4">
                        <img src="${doc.image}" class="w-16 h-16 rounded-full object-cover">
                        <div>
                            <h3 class="font-bold">${doc.name}</h3>
                            <p class="text-primary text-sm">${doc.specialty}</p>
                            <div class="flex items-center text-yellow-500 text-sm">
                                ${'★'.repeat(Math.floor(doc.rating))}${doc.rating % 1 ? '½' : ''}
                                <span class="text-gray-500 ml-1">(${doc.reviews})</span>
                            </div>
                        </div>
                    </div>
                    <div class="mt-3 text-sm text-gray-500"><i class="fas fa-map-pin w-4"></i> ${doc.city}</div>
                    <a href="doctor-profile.html?id=${doc.id}" class="mt-4 block text-center bg-primary/10 text-primary font-semibold py-2.5 rounded-xl hover:bg-primary hover:text-white">View profile & book</a>
                </div>
            `).join('');
        } catch (err) {
            console.error(err);
            container.innerHTML = '<p class="text-red-500">Failed to load doctors.</p>';
        }
    };

    // For backward compatibility with existing filters
    window.renderDoctorCards = window.fetchAndRenderDoctors;

    // ---------- DOCTOR PROFILE (Real API) ----------
    window.renderDoctorProfile = function(doctor) {
        const container = document.getElementById('profileContent');
        if (!doctor) {
            container.innerHTML = '<p>Doctor not found</p>';
            return;
        }

        const slots = ['09:00', '10:30', '14:00', '16:30']; // Mock slots

        container.innerHTML = `
            <div class="flex flex-col md:flex-row gap-8">
                <div class="md:w-1/3"><img src="${doctor.image}" class="w-full rounded-2xl"></div>
                <div class="md:w-2/3">
                    <h2 class="text-3xl font-bold">${doctor.name}</h2>
                    <p class="text-primary text-lg">${doctor.specialty}</p>
                    <div class="flex items-center mt-2">
                        ${'★'.repeat(Math.floor(doctor.rating))}
                        <span class="text-gray-600 ml-2">${doctor.reviews} reviews</span>
                    </div>
                    <p class="mt-4"><i class="fas fa-map-marker-alt"></i> ${doctor.city}</p>
                    <h3 class="font-semibold mt-6 mb-3">Available time slots</h3>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        ${slots.map(slot => `
                            <button onclick="openBookingModal('${doctor.name}', '${slot}', '${doctor.id}')"
                                class="border border-primary/40 text-primary rounded-lg py-2 px-3 hover:bg-primary hover:text-white">
                                ${slot}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    };

    // ---------- BOOKING MODAL ----------
    window.openBookingModal = function(docName, time, doctorId) {
        sessionStorage.setItem("selectedDoctorId", doctorId);
        sessionStorage.setItem("selectedTime", time);
        sessionStorage.setItem("selectedType", "in-person");

        const modalDetails = document.getElementById('modalDetails');
        if (modalDetails) {
            modalDetails.innerHTML = `
                <p class="font-medium">${docName}</p>
                <p>${time} • ${sessionStorage.getItem("selectedType")}</p>
            `;
        }
        document.getElementById('bookingModal').classList.remove('hidden');
    };

    window.closeBookingModal = () => {
        document.getElementById('bookingModal').classList.add('hidden');
    };

    window.confirmBooking = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Please log in to book an appointment.");
            window.location.href = "login.html";
            return;
        }

        const doctorId = sessionStorage.getItem("selectedDoctorId");
        const date = sessionStorage.getItem("selectedDate") || new Date().toISOString().split('T')[0];
        const time = sessionStorage.getItem("selectedTime") || "10:30";
        const type = sessionStorage.getItem("selectedType") || "in-person";

        if (!doctorId) {
            alert("No doctor selected.");
            return;
        }

        try {
            const response = await fetch("/api/appointments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ doctorId, date, time, type }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Booking failed");

            alert("Appointment confirmed!");
            closeBookingModal();
            window.location.href = "appointments.html";
        } catch (error) {
            alert(error.message);
        }
    };

    // ---------- APPOINTMENTS PAGE (Real API) ----------
    window.renderAppointments = async function() {
        const token = localStorage.getItem("token");
        const upcomingList = document.getElementById('upcomingList');
        const pastList = document.getElementById('pastList');

        if (!token) {
            if (upcomingList) upcomingList.innerHTML = '<p class="text-gray-500">Please log in to view appointments.</p>';
            if (pastList) pastList.innerHTML = '';
            return;
        }

        try {
            const response = await fetch('/api/appointments', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch appointments');

            const appointments = await response.json();
            const today = new Date().toISOString().split('T')[0];
            const upcoming = appointments.filter(apt => apt.date >= today);
            const past = appointments.filter(apt => apt.date < today);

            if (upcomingList) {
                upcomingList.innerHTML = upcoming.length ? upcoming.map(apt => `
                    <div class="bg-white p-4 rounded-xl border flex justify-between items-center">
                        <div>
                            <p class="font-bold">${apt.doctor_name || 'Doctor'}</p>
                            <p class="text-sm text-gray-500">${apt.date} at ${apt.time} • ${apt.type}</p>
                        </div>
                        <button class="text-primary text-sm">Manage</button>
                    </div>
                `).join('') : '<p class="text-gray-500">No upcoming appointments</p>';
            }

            if (pastList) {
                pastList.innerHTML = past.length ? past.map(apt => `
                    <div class="bg-white p-4 rounded-xl border flex justify-between items-center opacity-70">
                        <div>
                            <p class="font-bold">${apt.doctor_name || 'Doctor'}</p>
                            <p class="text-sm text-gray-500">${apt.date} at ${apt.time} • ${apt.type}</p>
                        </div>
                        <button class="text-gray-400 text-sm">Review</button>
                    </div>
                `).join('') : '<p class="text-gray-500">No past appointments</p>';
            }
        } catch (error) {
            console.error(error);
            if (upcomingList) upcomingList.innerHTML = '<p class="text-red-500">Error loading appointments.</p>';
            if (pastList) pastList.innerHTML = '';
        }
    };

    // ---------- TELECONSULT (Real API) ----------
    window.renderTeleconsult = async function() {
        const container = document.getElementById('teleDoctorsContainer');
        if (!container) return;

        try {
            const res = await fetch('/api/doctors');
            const doctors = await res.json();
            const teleDoctors = doctors.filter(d => d.teleconsult == 1);

            container.innerHTML = teleDoctors.map(doc => `
                <div class="bg-white rounded-2xl p-5 border shadow-sm">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-video text-primary"></i>
                        <span class="font-bold">${doc.name}</span>
                    </div>
                    <p class="text-sm">${doc.specialty}</p>
                    <button onclick="openBookingModal('${doc.name} (Teleconsult)', 'Video call', '${doc.id}')"
                        class="mt-4 w-full bg-primary text-white py-2 rounded-xl">Book video</button>
                </div>
            `).join('');
        } catch (err) {
            console.error(err);
            container.innerHTML = '<p class="text-red-500">Failed to load teleconsult doctors.</p>';
        }
    };

    // ---------- PAGE INITIALIZATION ----------
    document.addEventListener('DOMContentLoaded', () => {
        updateAuthUI();

        // Determine current page and run appropriate logic
        const path = window.location.pathname;

        // Doctors page filters
        const applyBtn = document.getElementById('applyFilters');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const specialty = document.getElementById('specialtyFilter')?.value;
                const city = document.getElementById('cityFilter')?.value;
                const today = document.getElementById('availableToday')?.checked;
                window.fetchAndRenderDoctors({ specialty, city, availableToday: today });
            });
            document.getElementById('resetFilters')?.addEventListener('click', () => {
                document.getElementById('specialtyFilter').value = '';
                document.getElementById('cityFilter').value = '';
                document.getElementById('availableToday').checked = false;
                window.fetchAndRenderDoctors();
            });
            // Initial load
            window.fetchAndRenderDoctors();
        }

        // Doctor profile page
        if (path.includes('doctor-profile.html')) {
            const params = new URLSearchParams(window.location.search);
            const doctorId = params.get('id');
            if (doctorId) {
                fetch(`/api/doctors`)
                    .then(res => res.json())
                    .then(doctors => {
                        const doctor = doctors.find(d => d.id == doctorId);
                        window.renderDoctorProfile(doctor);
                    })
                    .catch(err => {
                        console.error(err);
                        document.getElementById('profileContent').innerHTML = '<p>Failed to load doctor.</p>';
                    });
            }
        }

        // Appointments page
        if (path.includes('appointments.html')) {
            window.renderAppointments();
        }

        // Teleconsult page
        if (path.includes('teleconsultation.html')) {
            window.renderTeleconsult();
        }
    });

})();