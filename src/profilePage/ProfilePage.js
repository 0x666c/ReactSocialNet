import React, {Component} from "react";
import {Col, Container, Image, Row} from "react-bootstrap";
import {getAvatarImage, getUserData, modifyAvatarImage} from "../App";
import "./ProfilePage.css";

export default class ProfilePage extends Component {
	constructor(props) {
		super();
		this.state = {iconLoaded: false, ownProfile: false};

		this.renderIcon = this.renderIcon.bind(this);
		this.uploadImageRef = React.createRef();
	}

	async componentDidMount() {
		let userData = await getUserData(this.props.who);
		// let avatarImageLink = await getAvatarImage(userData.username).then((resp) => URL.createObjectURL(resp));
		let avatarImageLink = await getAvatarImage(userData.username);
		this.setState({
			userData,
			ownProfile: userData.username === this.props.myName,
			icon: (
				<Image
					onLoad={() => {
						this.setState({iconLoaded: true});
					}}
					rounded
					className="profile-page-icon"
					// src={`https://www.gravatar.com/avatar/${md5(userData.email || "")}?d=retro&s=300`}
					src={avatarImageLink}
				/>
			),
		});
	}

	uploadImage(file) {
		console.log(file);
		const reader = new FileReader();
		reader.onload = () => {
			modifyAvatarImage(this.state.userData.username, reader.result).then((resp) => {
				if (resp.error) {
					alert("Error: " + resp.error);
				} else {
					// I don't know if you can do that
					this.componentDidMount();
				}
			});
			console.log("Now reload, the image should be updated");
		};
		reader.onerror = (err) => {
			console.log("Error reading file", err);
		};
		reader.readAsArrayBuffer(file);
	}

	renderUploadImageButton() {
		if (this.state.ownProfile) {
			return (
				<>
					<input
						onChange={(ev) => this.uploadImage(ev.target.files[0])}
						accept=".png, .jpg, .jpeg, .gif, .bmp"
						type="file"
						ref={this.uploadImageRef}
						className="d-none"
					></input>
					<button onClick={() => this.uploadImageRef.current.click()} className="pfp-test">
						Upload image...
					</button>
				</>
			);
		} else {
			return null;
		}
	}

	renderIcon() {
		return (
			<div className="profile-page-icon">
				{this.state.icon}
				{this.renderUploadImageButton()}
			</div>
		);
	}

	status() {
		return this.state.userData.status ? `"${this.state.userData.status}"` : "";
	}

	render() {
		if (!this.state.userData) {
			return null;
		} else {
			return (
				<div className="content-container">
					<Container style={{width: "54%"}}>
						<Row className="profile-page-background">
							<Col xs="auto">
								<this.renderIcon />
							</Col>
							<Col xs="auto" className="flex-fill px-0 mr-3">
								<Container fluid className="profile-page-info">
									<Row>
										<Col xs="9" className="profile-page-info-username">
											{this.state.userData.username}{" "}
											{this.state.ownProfile && (
												<span className="text-muted d-inline-block" style={{transform: "scale(0.5) translate(-25px,6px)"}}>
													(me)
												</span>
											)}
										</Col>
										<Col xs="3" className="profile-page-info-accountAge d-flex justify-content-end align-items-center">
											User for 69 days
										</Col>
									</Row>
									<Row>
										<Col xs="12" className="profile-page-info-status">
											{/* This user's long and probably edgy status of many words and thoughts. Another sentence of the user's status, informative, isn't it? */}
											{this.status()}
										</Col>
									</Row>
									<div className="profile-page-info-bestpostLabel">{this.state.userData.username}'s best posts:</div>
									<Row className="justify-content-start profile-page-info-bestPosts-container">
										{/* <Col xs="auto">
											<Image className="profile-page-info-bestPosts" width="150" height="150" src="https://picsum.photos/150?random=1"></Image>
										</Col> */}
									</Row>
								</Container>
							</Col>
						</Row>
					</Container>
				</div>
			);
		}
	}
}
