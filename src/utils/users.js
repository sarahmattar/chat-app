const users = [];

// track a new user
const addUser = ({ id, username, room }) => {
	// clean data from client, id will come from the socket
	username = username.trim().toLowerCase();
	room = room.trim().toLowerCase();

	// validate the data
	if (!username || !room) {
		return {
			error: 'Username and/or Room are required.',
		};
	}

	// Check for existing user
	const existingUser = users.find((user) => {
		return user.room === room && user.username === username;
	});
	if (existingUser) {
		return {
			error: 'Username is already in use.',
		};
	}

	// Store user
	const user = { id, username, room };

	users.push(user);

	return { user };
};

// stop tracking a user when they leave a room
const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id)

    if (index !== -1) {
        return users.splice(index, 1)[0]
    }
}

// fetch an existing user's data
const getUser = (id) => {
    return users.find((user) => user.id === id)
}

// fetch all users in a room
const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    return users.filter(user => user.room === room);
}


module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom,
};
