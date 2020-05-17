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
        adminList.push(...await getAdminsInAccount('self', findAllRoleTypes, authToken));
    }

    // Grab sub account admins
    if (isFindingSubAdmins) {
        const subAccount = await findSubAccountNumber(authToken);

        if (subAccount) {
            adminList.push(...await getAdminsInAccount(subAccount, findAllRoleTypes, authToken));
        }
    }

    // Pick random admin and act as them
    actAsUser(adminList[Math.floor(Math.random() * adminList.length)]);
}

function masqAsTeacher(authToken) {
    console.log('teacher');
}

function masqAsStudent(authToken) {
    console.log('student');
}

function masqAsObserver(authToken) {
    console.log('observer');
}

function masqAsTA(authToken) {
    console.log('ta');
}

function masqAsDesigner(authToken) {
    console.log('designer');
}

function actAsUser(id) {
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