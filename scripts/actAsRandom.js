chrome.storage.local.get(['masqueradingOptions'], data => {
    let masqueradingOptions = data.masqueradingOptions;

    // Masquerade
    switch (masqueradingOptions.role) {
        case 'admin':
            masqAsAdmin(masqueradingOptions.includedRoles);
            break;
        case 'teacher':
            masqAsTeacher();
            break;
        case 'student':
            masqAsStudent();
            break;
        case 'observer':
            masqAsObserver();
            break;
        case 'ta':
            masqAsTA();
            break;
    }
});

function masqAsAdmin(options) {
    console.log('admin');
}

function masqAsTeacher() {
    console.log('teacher');
}

function masqAsStudent() {
    console.log('student');
}

function masqAsObserver() {
    console.log('observer');
}

function masqAsTA() {
    console.log('ta');
}