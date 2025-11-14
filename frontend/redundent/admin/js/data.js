// data.js – shared storage handler for admin and tutor
const STORAGE_KEYS = {
    TUTORS: "dch_tutors",
};

function getTutors() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TUTORS)) || [];
}

function saveTutors(tutors) {
    localStorage.setItem(STORAGE_KEYS.TUTORS, JSON.stringify(tutors));
}
