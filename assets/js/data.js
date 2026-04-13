// Mock Doctors Database
window.DocPocData = {
    doctors: [
        { id: 1, name: 'Dr. Amine Benali', specialty: 'Cardiologist', city: 'Casablanca', rating: 4.8, reviews: 124, image: 'https://images.pexels.com/photos/5215024/pexels-photo-5215024.jpeg?w=150&h=150&fit=crop', availableToday: true, teleconsult: true },
        { id: 2, name: 'Dr. Salma El Fassi', specialty: 'Dermatologist', city: 'Rabat', rating: 5.0, reviews: 87, image: 'https://images.pexels.com/photos/5327656/pexels-photo-5327656.jpeg?w=150&h=150&fit=crop', availableToday: false, teleconsult: true },
        { id: 3, name: 'Dr. Youssef Alaoui', specialty: 'General practitioner', city: 'Casablanca', rating: 4.2, reviews: 203, image: 'https://images.pexels.com/photos/4173239/pexels-photo-4173239.jpeg?w=150&h=150&fit=crop', availableToday: true, teleconsult: false },
        // ... more doctors (include specialties: Dentist, Gynecologist, etc.)
    ],
    appointments: [
        { id: 101, doctorId: 1, date: '2026-04-15', time: '10:30', status: 'upcoming', type: 'in-person' },
        { id: 102, doctorId: 2, date: '2026-04-10', time: '14:15', status: 'past', type: 'teleconsult' },
    ]
};