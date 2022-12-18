const socket = io();

const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');

const $messages = document.querySelector('#messages');

const $sendLocationButton = document.querySelector('#send-location');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options for QueryString
const { username, room } = Qs.parse(location.search, {
	ignoreQueryPrefix: true,
});

$messageForm.addEventListener('submit', (event) => {
	event.preventDefault();
	const message = event.target.elements.message.value;
	$messageFormButton.setAttribute('disabled', 'disabled');

	// acknowledge delivery
	socket.emit('sendMessage', message, (error) => {
		$messageFormButton.removeAttribute('disabled');
		$messageFormInput.value = '';
		$messageFormInput.focus();
		if (error) {
			return console.log(error);
		}
	});
});

const autoscroll = () => {
	//get the new message element and calculate it's height
	const $newMessage = $messages.lastElementChild;

	const newMessageStyles = getComputedStyle($newMessage);
	const newMessageMargin = parseInt(newMessageStyles.marginBottom);
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

	// get the visible height of messages list
	const visibleHeight = $messages.offsetHeight;

	// height of messages container (on and off-screen)
	const containerHeight = $messages.scrollHeight;

	// how far down have we actually scrolled?
	const scrollOffset = $messages.scrollTop + visibleHeight;

	// subtract height of last message to see if we were scrolled to the bottom before new message added
	if (containerHeight - newMessageHeight <= scrollOffset) {
		$messages.scrollTop = $messages.scrollHeight;
	}
};

socket.on('message', (message) => {
	const html = Mustache.render(messageTemplate, {
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format('L h:mm:ss a'),
	});
	$messages.insertAdjacentHTML('beforeend', html);
	autoscroll();
});

socket.on('locationMessage', (message) => {
	const html = Mustache.render(locationTemplate, {
		username: message.username,
		url: message.url,
		createdAt: moment(message.createdAt).format('L h:mm:ss a'),
	});
	$messages.insertAdjacentHTML('beforeend', html);
	autoscroll();
});

socket.on('roomData', ({ room, users }) => {
	const html = Mustache.render(sidebarTemplate, {
		room,
		users,
	});
	document.querySelector('#sidebar').innerHTML = html;
	autoscroll();
});

$sendLocationButton.addEventListener('click', () => {
	if (!navigator.geolocation) {
		return alert('Geolocation is not supported by your browser');
	}

	$sendLocationButton.setAttribute('disabled', 'disabled');
	$sendLocationButton.innerHTML = 'Sending...';

	navigator.geolocation.getCurrentPosition((position) => {
		socket.emit(
			'sendLocation',
			{
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
			},
			(callbackMessage) => {
				$sendLocationButton.removeAttribute('disabled');
				$sendLocationButton.innerHTML = 'Send Location';
				console.log(callbackMessage);
			}
		);
	});
});

socket.emit('join', { username, room }, (error) => {
	if (error) {
		alert(error);
		location.href = '/';
	}
});
