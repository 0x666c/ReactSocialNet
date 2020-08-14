import "bootstrap/dist/css/bootstrap.min.css";
import Cookies from "js-cookie";
import React, {Component} from "react";
import {Col, Container, Image, Navbar, Row} from "react-bootstrap";
import {Redirect, Route, Switch, withRouter} from "react-router";
import sha256 from "sha256";
import "./App.css";
import FeedPage from "./posting/FeedPage";
import LoginPage from "./loginPage/LoginPage";
import ProfileIcon from "./profileIcon/ProfileIcon";
import SignUpPage from "./signUpPage/SignUpPage";
import "./Variables.css";
import WhiteWall from "./WhiteWall";
import ProfilePage from "./profilePage/ProfilePage";
import NotFoundPage from "./NotFoundPage";
import PostCreatePage from "./posting/PostCreatePage";
import {Link} from "react-router-dom";
import ChangelogPage from "./changelog/ChangelogPage";

const VERSION = "0.0.2";

document.onload = () => {
	console.log("LOAD");
};

document.server = {};
document.Cookies = Cookies;

document.server.root = "http://217.15.202.178:7777";
// document.server.root = "http://localhost:7777";
document.server.users = "users";
document.server.posts = "post";
document.server.media = "media";
document.server.typeAvatar = "avatar";
document.server.typeFile = "image";
document.server.typePostImage = "post-image";
document.server.folderAvatars = "avatars";
document.server.folderImages = "images";
document.server.folderPosts = "posts";

class App extends Component {
	constructor() {
		super();

		this.state = {
			renderable: false, //
			cookieLogged: null,
			checkerId: -1,

			userData: {},
		};

		this.updateOwnData = this.updateOwnData.bind(this);
	}

	componentDidMount() {
		validateSession().then((success) => {
			this.setState({cookieLogged: success});
			console.log("Cookie worked: " + success);
		});
		getLoginFromSession().then((resp) => {
			// Is this safe?
			if (!resp.username) {
				this.setState({
					renderable: true,
				});
				return;
			}
			getUserData(resp.username).then((data) => {
				console.log(data);
				this.setState({
					userData: data,
					renderable: true,
				});
			});
		});

		// Then on timeout
		// 30 Seconds
		this.checkerId = setInterval(async () => {
			if (!this.state.cookieLogged) {
				return;
			}
			let login = await getLoginFromSession();
			// Is this safe?
			if (!login.username) return;
			let data = await getUserData(login.username);
			this.setState({
				userData: data,
			});
		}, 30000);

		this.props.history.listen(this.updateOwnData);
	}

	componentWillUnmount() {
		clearInterval(this.checkerId);
	}

	render() {
		if (!this.state.renderable) {
			return (
				<>
					<Link to="/changelog" className="version-display">
						{VERSION}
					</Link>
					<WhiteWall show={true}></WhiteWall>
				</>
			);
		} else {
			return (
				<>
					<Link to="/changelog" className="version-display">
						{VERSION}
					</Link>
					<Navbar fixed="top" className="border navbar">
						<Container>
							<Row className="justify-content-around w-100">
								<Col xs={{offset: 1, span: 5}}>
									<Navbar.Brand
										onClick={() => {
											if (this.props.history.location.pathname !== "/") {
												window.location.href = "/";
											}
										}}
									>
										<Image className="logo-image" src={process.env.PUBLIC_URL + "/logo.png"}></Image>
									</Navbar.Brand>
								</Col>
								<Col xs={{offset: 0, span: 5}}>{this.state.userData && this.state.userData.email && <ProfileIcon userData={this.state.userData} />}</Col>
								<Col xs={{offset: 0, span: 1}} />
							</Row>
						</Container>
					</Navbar>
					{!this.state.cookieLogged && <Redirect exact from="/*" to="/login" />}
					<Switch>
						{this.state.cookieLogged && <Redirect strict exact from="/login" to="/" />}
						<Route exact path="/login">
							<LoginPage />
						</Route>
						<Route exact path="/signup">
							<SignUpPage />
						</Route>
						<Route exact path="/p:profile">
							{({match}) => <ProfilePage who={match.params.profile} myName={this.state.userData.username} />}
						</Route>
						<Route exact path="/create">
							<PostCreatePage myName={this.state.userData.username} />
						</Route>

						<Route exact path="/changelog">
							<ChangelogPage />
						</Route>
						<Route exact path="/">
							<FeedPage currentUser={this.state.userData} />
						</Route>
						<Route exact path="/*">
							<NotFoundPage />
						</Route>
					</Switch>
				</>
			);
		}
	}

	updateOwnData() {
		getLoginFromSession().then((resp) => {
			// Is this safe?
			if (!resp.username) {
				this.setState({
					renderable: true,
				});
				return;
			}
			getUserData(resp.username).then((data) => {
				console.log(data);
				this.setState({
					userData: data,
				});
			});
		});
	}
}

export async function signWithCookie() {
	if (!Cookies.get("session")) {
		return {
			logged: false,
			error: null,
		};
	}
	return fetchLoginData(null, null, null);
}

export async function getUserData(username) {
	if (!username) {
		debugger;
	}
	return await fetch(`${document.server.root}/${document.server.users}`, {
		method: "POST",
		credentials: "include",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			request: "info",
			login: username,
		}),
	})
		.then((resp) => resp.json())
		.then((resp) => {
			return resp;
		})
		.catch((reason) => {
			if (reason.toString().includes("NetworkError when attempting to fetch resource")) {
				return {logged: false, error: "Request timed out."};
			} else {
				return {logged: false, error: reason.toString()};
			}
		});
}

export async function getLoginFromSession() {
	return await fetch(`${document.server.root}/${document.server.users}`, {
		method: "POST",
		credentials: "include",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			request: "ownUsername",
		}),
	})
		.then((resp) => resp.json())
		.then((resp) => {
			return resp;
		})
		.catch((reason) => {
			if (reason.toString().includes("NetworkError when attempting to fetch resource")) {
				return {logged: false, error: "Request timed out."};
			} else {
				return {logged: false, error: reason.toString()};
			}
		});
}

// Returns true/false
export async function validateSession() {
	if (!Cookies.get("session")) {
		return false;
	}
	return fetchLoginData("", "", false).then((resp) => resp.logged);
}

export async function signWithPassword(login, password, publicPc) {
	return fetchLoginData(login, password, publicPc);
}

export async function logout() {
	return await fetch(`${document.server.root}/${document.server.users}`, {
		method: "POST",
		credentials: "include",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			request: "logout",
		}),
	})
		.then((resp) => resp.json())
		.then((resp) => {
			return resp;
		})
		.catch((reason) => {
			if (reason.toString().includes("NetworkError when attempting to fetch resource")) {
				return {logged: false, error: "Request timed out."};
			} else {
				return {logged: false, error: reason.toString()};
			}
		});
}

async function fetchLoginData(login, password, publicPc) {
	return await fetch(`${document.server.root}/${document.server.users}`, {
		method: "POST",
		credentials: "include",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			request: "login",
			login,
			password: !!password ? sha256(password) : "",
			publicPc,
		}),
	})
		.then((resp) => resp.json())
		.then((resp) => {
			console.log(resp);
			return resp;
		})
		.catch((reason) => {
			if (reason.toString().includes("NetworkError when attempting to fetch resource")) {
				return {logged: false, error: "Request timed out."};
			} else {
				return {logged: false, error: reason.toString()};
			}
		});
}

export async function getMedia(folder, file, type) {
	return await fetch(`${document.server.root}/media/${folder}/${file}/${type}`, {
		method: "GET",
		credentials: "include",
		headers: {
			// Accept: "application/json",
			// "Content-Type": "application/json",
		},
	})
		.then((resp) => resp.blob())
		.then((resp) => {
			return resp;
		})
		.catch((reason) => {
			if (reason.toString().includes("NetworkError when attempting to fetch resource")) {
				return {logged: false, error: "Request timed out."};
			} else {
				return {logged: false, error: reason.toString()};
			}
		});
}

export async function uploadMedia(folder, file, type, body) {
	return await fetch(`${document.server.root}/media/add/${folder}/${file}/${type}`, {
		method: "POST",
		credentials: "include",
		headers: {
			// Accept: "application/json",
			// "Content-Type": "application/json",
		},
		body,
	})
		.then((resp) => resp.blob())
		.then((resp) => {
			return resp;
		})
		.catch((reason) => {
			if (reason.toString().includes("NetworkError when attempting to fetch resource")) {
				return {logged: false, error: "Request timed out."};
			} else {
				return {logged: false, error: reason.toString()};
			}
		});
}

export async function getAvatarImage(username) {
	const media = await getMedia(document.server.folderAvatars, username, document.server.typeAvatar);
	console.log(media);
	return URL.createObjectURL(media);
}

export async function modifyAvatarImage(user, binaryData) {
	return uploadMedia(document.server.folderAvatars, user, document.server.typeAvatar, binaryData);
}

export function getPostHeaderLink(id) {
	const mediaLink = `${document.server.root}/media/${document.server.folderPosts + "-" + id}/header/${document.server.typePostImage}`;
	console.log(mediaLink);
	return mediaLink;
}

export function getPostAdditionalLink(id, index) {
	const mediaLink = `${document.server.root}/media/${document.server.folderPosts + "-" + id}/${index}/${document.server.typePostImage}`;
	console.log(mediaLink);
	return mediaLink;
}

// export async function getPostHeader(id) {
// 	const media = await getMedia(document.server.folderPosts + "-" + id, "header", document.server.typePostImage);
// 	console.log(media);
// 	return URL.createObjectURL(media);
// }

// export async function getPostAdditional(id, index) {
// 	const media = await getMedia(document.server.folderAvatars + "-" + id, index, document.server.typePostImage);
// 	console.log(media);
// 	return URL.createObjectURL(media);
// }

export async function makePost(username, header, additional, text, attachments) {
	return await fetch(`${document.server.root}/${document.server.posts}`, {
		method: "POST",
		credentials: "include",
		body: JSON.stringify({
			request: "add",
			username,
			header,
			additional,
			text,
			attachments,
		}),
	})
		.then((resp) => resp.json())
		.then((resp) => {
			return resp;
		})
		.catch((reason) => {
			if (reason.toString().includes("NetworkError when attempting to fetch resource")) {
				return {logged: false, error: "Request timed out."};
			} else {
				return {logged: false, error: reason.toString()};
			}
		});
}

export async function getPost(id) {
	return await fetch(`${document.server.root}/${document.server.posts}`, {
		method: "POST",
		credentials: "include",
		body: JSON.stringify({
			request: "get",
			id,
		}),
	})
		.then((resp) => resp.json())
		.then((resp) => {
			return resp;
		})
		.catch((reason) => {
			if (reason.toString().includes("NetworkError when attempting to fetch resource")) {
				return {logged: false, error: "Request timed out."};
			} else {
				return {logged: false, error: reason.toString()};
			}
		});
}

export async function getAvailablePosts() {
	return await fetch(`${document.server.root}/availablePosts`, {
		method: "GET",
	})
		.then((resp) => resp.text())
		.then((resp) => {
			return resp;
		})
		.catch((reason) => {
			if (reason.toString().includes("NetworkError when attempting to fetch resource")) {
				return {logged: false, error: "Request timed out."};
			} else {
				return {logged: false, error: reason.toString()};
			}
		});
}

export default withRouter(App);
