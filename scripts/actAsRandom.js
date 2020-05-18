chrome.storage.local.get(['masqueradingOptions', 'ctoolhuAuthToken'], data => {
    const authToken = data.ctoolhuAuthToken;
	if (!authToken) {
		alert('No auth token set');
		return;
	}

    let masqueradingOptions = data.masqueradingOptions;

    // Masquerade
    switch (masqueradingOptions.role) {
        case 'admin':
            masqAsAdmin(masqueradingOptions.includedRoles, authToken);
            break;
        case 'teacher':
            masqAsTeacher(authToken);
            break;
        case 'student':
            masqAsStudent(authToken);
            break;
        case 'observer':
            masqAsObserver(authToken);
            break;
        case 'ta':
            masqAsTA(authToken);
            break;
        case 'designer':
            masqAsDesigner(authToken);
            break;
    }
});

async function masqAsAdmin(options, authToken) {
    let isFindingRootAdmins = options.find(element => element === 'rootAccountAdmins') != undefined;
    let isFindingSubAdmins = options.find(element => element === 'subAccountAdmins') != undefined;
    let findAllRoleTypes = options.find(element => element === 'allAdmins') != undefined;

    let adminList = [];

    // Grab root account admins
    if (isFindingRootAdmins) {
        const tempList = await getAdminsInAccount('self', findAllRoleTypes, authToken);

        adminList.push(...tempList);
    }

    // Grab sub account admins
    if (isFindingSubAdmins) {
        const subAccount = await findSubAccountNumber(authToken);

        if (subAccount) {
            const tempList = await getAdminsInAccount(subAccount, findAllRoleTypes, authToken);

            adminList.push(...tempList);
        }
    }

    // Pick random admin and act as them
    actAsUser(adminList[Math.floor(Math.random() * adminList.length)]);
}

async function masqAsTeacher(authToken) {
    const teacherList = await getUsersInCourse('teacher', authToken);

    actAsUser(teacherList[Math.floor(Math.random() * teacherList.length)]);
}

async function masqAsStudent(authToken) {
    const studentList = await getUsersInCourse('student', authToken);

    actAsUser(studentList[Math.floor(Math.random() * studentList.length)]);
}

async function masqAsObserver(authToken) {
    const observerList = await getUsersInCourse('observer', authToken);

    actAsUser(observerList[Math.floor(Math.random() * observerList.length)]);
}

async function masqAsTA(authToken) {
    const taList = await getUsersInCourse('ta', authToken);

    actAsUser(taList[Math.floor(Math.random() * taList.length)]);
}

async function masqAsDesigner(authToken) {
    const designerList = await getUsersInCourse('designer', authToken);

    actAsUser(designerList[Math.floor(Math.random() * designerList.length)]);
}

function actAsUser(id) {
    if (!id) {
        return;
    }

    if (/\?/.test(document.URL)) {
        window.location.href = `${document.URL}&become_user_id=${id}`;
    } else {
        window.location.href = `${document.URL}?become_user_id=${id}`;
    }
}

async function getAdminsInAccount(account, findAllRoleTypes, authToken) {
    let tempList = await paginate(`${document.location.origin}/api/v1/accounts/${account}/admins`, '', authToken);

    // We don't want API, SIS, or Jenzabar admins
    tempList = tempList.filter(adminObj => !/(API)|(SIS)|(Jenzabar)/.test(adminObj.user.name));

    if (findAllRoleTypes) {
        // We only care about the User IDs
        tempList = tempList.map(adminObj => adminObj.user.id);
    } else {
        // Only grab account admin types
        tempList = tempList.filter(adminObj => adminObj.role_id === 1).map(adminObj => adminObj.user.id);
    }

    return tempList;
}

async function getUsersInCourse(enrollmentType, authToken) {
    if (/courses\/\d+/.test(document.location.pathname)) {
        const courseNumber = document.location.pathname.match(/courses\/(\d+)/)[1];

        // Find teachers in course
        let userList = await paginate(`${document.location.origin}/api/v1/courses/${courseNumber}/users`, `enrollment_type[]=${enrollmentType}`, authToken);

        // Map to ID
        userList = userList.map(enrollment => enrollment.id);
        return userList;
    }
    return [];
}

async function findSubAccountNumber(authToken) {
    // Assume this is the right subaccount if we're in it
    if (/accounts\/\d+/.test(document.location.pathname)) {
        const id = document.location.pathname.match(/accounts\/(\d+)/)[1];

        // Test to see if this is actually a subaccount
        const accountAPI = await paginate(`${document.location.origin}/api/v1/accounts/${id}`, '', authToken);

        if (accountAPI.root_account_id) {
            return id;
        } else {
            return null;
        }
    } else if (/courses\/\d+/.test(document.location.pathname)) {
        const courseID = document.location.pathname.match(/courses\/(\d+)/)[1];

        // Get subaccount ID
        const courseAPI = await paginate(`${document.location.origin}/api/v1/courses/${courseID}`, '', authToken);

        // This is not in a subaccount
        if (courseAPI.account_id === courseAPI.root_account_id) {
            return null;
        } else {
            return courseAPI.account_id;
        }
    } else {
        return null;
    }
}