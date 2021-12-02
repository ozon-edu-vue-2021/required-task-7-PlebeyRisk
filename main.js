'use strict';

const urlUserDataJson = "data.json";
const contactListElem = document.querySelector('#contacts-list');
const detailListElem = document.querySelector('#detail-list');
const backIconElem = document.querySelector('#back');
const userTemplateElem = document.querySelector('#user-template');
const userInfoElem = document.querySelector('#container .details-view');

let users = [];
let popularity = [];
let lastOpenedUser = null;

const resetRoute = () => {
  window.location = window.location.origin + '#';
}

const fetchJson = async (url) => {
  try {
    const data = await fetch(url);

    return await data.json();
  } catch (error) {
    console.error(error);
  }
};

const loadUsers = async () => {
  const response = (await fetchJson(urlUserDataJson) || []);

  users = response.reduce((acc, item) => ({...acc, [item.id]: item }), {});

  return users;
};

const initialState = async () => {
  await loadUsers();

  renderContactList();
  resetRoute();
}

const calcPopularity = () => {
  const popularityMap = {};

  Object.values(users).forEach((user) => {
    user.friends.forEach((friendId) => {
      popularityMap[friendId] = (popularityMap[friendId] || 0) + 1;
    });
  });

  popularity = Object.entries(popularityMap)
    .reduce((acc, [key, value]) => {
      acc.push({ userId: key, value });
      return acc;
    }, [])
    .sort((a, b) => a.value - b.value)
    .sort((a, b) => {
      if (users[a.userId].name > users[b.userId].name) {
        return 1;
      }
      if (users[a.userId].name < users[b.userId].name) {
        return -1;
      }
      return 0;
    })
    .map((item) => item.userId)
    .reverse();
}

const getPopularUsersForUser = (userId) => {
  let popularUsers = popularity.filter((item) => item !== userId);

  if (popularUsers?.length > 3) {
    popularUsers = popularUsers.slice(0, 3);
  }

  return popularUsers;
}

const calcPopularUsersForUser = (userId) => {
  const user = users[userId];

  if (!user || user.popular) {
    return;
  }

  user.popular = getPopularUsersForUser(userId);

  return user.popular;
}

const getNotFriendsForUser = (userId) => {
  const user = users[userId];

  if (!user) {
    return [];
  }

  let notFriends = popularity.filter((popUserId) =>
    popUserId !== userId && !user.friends.includes(popUserId));

  if (notFriends?.length > 3) {
    notFriends = notFriends.slice(0, 3);
  }

  return notFriends;
}

const calcNotFriendsForUser = (userId) => {
  const user = users[userId];

  if (!user || user.notFriends) {
    return;
  }

  user.notFriends = getNotFriendsForUser(userId);

  return user.notFriends;
}

const showUserInfo = function (userId) {
  const user = users[userId];

  if (!user) {
    return;
  }

  const fillContent = (searchStr, userField) => {
    const elems = document.querySelectorAll(searchStr);

    elems.forEach((elem, index) => {
      const liUser = users[user[userField][index]];

      elem.dataset.id = liUser?.id || 0;

      const nameElem = elem.querySelector('span');

      if (!nameElem) {
        return;
      }

      nameElem.textContent = liUser?.name || '';
    });
  };

  if (lastOpenedUser !== userId) {
    const name = document.querySelector('#container .details-view .background .user strong');

    name.textContent = users[userId]?.name || '';

    fillContent('.user.friend', 'friends');
    fillContent('.user.not-friend', 'notFriends');
    fillContent('.user.popular', 'popular');
  }

  lastOpenedUser = userId;
  userInfoElem.classList.add('show');
}

const hideUserInfo = () => {
  userInfoElem.classList.remove('show');
};

const goToUsersList = () => {
  resetRoute()
  hideUserInfo();
};

const goToUser = (userId) => {
  if (!popularity?.length) {
    calcPopularity();
  }

  calcPopularUsersForUser(userId);
  calcNotFriendsForUser(userId);

  window.location = window.location.origin + `#user/${userId}`;

  showUserInfo(userId);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const renderContactList = () => {
  Object.values(users).forEach((user) => {
    const clone = userTemplateElem.content.cloneNode(true);
    const li = clone.querySelector('li');
    const name = clone.querySelector('strong');

    li.dataset.id = user.id;

    name.textContent = user.name;

    contactListElem.appendChild(clone);
  });
};

const onUsersListsClickHandler = (evt) => {
  evt.preventDefault();

  const userElem = evt.target.closest('li.user');

  if (!userElem) {
    return;
  }

  const userId = userElem.dataset.id;

  if (userId) {
    goToUser(userId);
  }
};

const onBackClick = () => {
  goToUsersList();
};

initialState();

contactListElem.addEventListener('click', onUsersListsClickHandler);
detailListElem.addEventListener('click', onUsersListsClickHandler);
backIconElem.addEventListener('click', onBackClick);