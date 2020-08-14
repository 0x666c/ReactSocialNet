import React, {Component} from "react";
import {Button, Col, Container, Form, FormGroup, Row, Spinner} from "react-bootstrap";
import {withRouter} from "react-router";
import PasswordArea from "../PasswordArea";
import "./SignUpPage.css";
import sha256 from "sha256";

const passwordMinLength = 4;
const passwordMaxLength = 128;

const emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

class SignUpPage extends Component {
	constructor() {
		super();

		this.state = {
			email: "",
			login: "",
			password: "",
			gender: -1,
			nsfw: false,
			status: "", // TEMPORARY

			passwordTooShort: true,
			passwordTooLong: false,
			passwordContainsControl: false,
			passwordContainsEmoji: false,
			passwordStrength: "",

			loading: false,
			error: null,
		};

		this.validatePassword = this.validatePassword.bind(this);
		this.register = this.register.bind(this);
	}

	async validatePassword(password) {
		let strength = "";
		if (password === null || password === undefined) {
			password = "";
		}
		console.log(password);

		const zxcvbn = (await import("zxcvbn")).default;
		let res = zxcvbn(password);
		if (password === "") {
			res.score = -1;
		}

		switch (res.score) {
			case 0:
				strength = "bad";
				break;
			case 1:
				strength = "medium";
				break;
			case 2:
				strength = "better";
				break;
			case 3:
				strength = "good";
				break;
			case 4:
				strength = "perfect";
				break;
			default:
				strength = "";
				break;
		}
		this.setState({
			passwordStrength: strength,
			passwordTooShort: password.length < passwordMinLength,
			passwordTooLong: password.length > passwordMaxLength,
			// Match all control characters except LF and CR
			passwordContainsControl: password.split("").some((ch) => ch.charCodeAt(0) < 32 && ch.charCodeAt(0) !== 10 && ch.charCodeAt(0) !== 13),
			passwordContainsEmoji: /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])$/.test(password),
		});
	}

	async register(email, login, password, gender, nsfw, status) {
		await fetch(`${document.server.root}/${document.server.users}`, {
			method: "POST",
			credentials: "include",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				request: "register",
				email,
				login,
				gender,
                nsfw,
                status,
				password: !!password ? sha256(password) : "",
			}),
		})
			.then((resp) => resp.json())
			.then((resp) => {
				console.log(resp);
				this.setState({
					error: resp.error,
				});
				if (!resp.error) {
					this.props.history.replace("/login");
				}
			})
			.catch((reason) => {
				if (reason.toString().includes("NetworkError when attempting to fetch resource")) {
					return {logged: false, error: "Request timed out."};
				} else {
					return {logged: false, error: reason.toString()};
				}
			});
	}

	render() {
		return (
			<div className="content-container">
				<Container className="pb-3">
					<Row className="justify-content-center">
						<Col xs="12" className="text-center display-1">
							Nice to have you with us!
						</Col>
					</Row>
				</Container>
				<Container className="mt-3">
					<Form
						method="POST"
						autoComplete="off"
						onSubmit={(ev) => {
							ev.preventDefault();
							console.log(
								"Tests:",
								this.state.passwordTooShort,
								this.state.passwordTooLong,
								this.state.passwordContainsControl,
								this.state.passwordContainsEmoji,
								this.state.login.length < 3,
								!emailRegex.test(this.state.email)
							);
							if (
								this.state.passwordTooShort ||
								this.state.passwordTooLong ||
								this.state.passwordContainsControl ||
								this.state.passwordContainsEmoji ||
								!emailRegex.test(this.state.email)
							) {
								this.setState({
									error: "Password doesn't match the requirements!",
								});
								return;
							}
							if (this.state.login.length < 3) {
								this.setState({
									error: "Please, enter a login containing 3 or more characters!",
								});
								return;
							}
							this.setState(
								{
									loading: true,
								},
								() =>
									this.register(this.state.email, this.state.login, this.state.password, this.state.gender, this.state.nsfw, this.state.status).then(() => {
										this.setState({loading: false});
									})
							);
						}}
					>
						<Row className="justify-content-center">
							<Col xs="5">
								<FormGroup controlId="email">
									<Form.Control
										size="lg"
										required
										onChange={(ev) => this.setState({email: ev.target.value})}
										value={this.state.email}
										type="email"
										placeholder="Enter your email"
									/>
								</FormGroup>
							</Col>
						</Row>
						<Row className="justify-content-center">
							<Col xs="5">
								<FormGroup controlId="login">
									<Form.Control
										size="lg"
										required
										onChange={(ev) => this.setState({login: ev.target.value})}
										value={this.state.login}
										type="text"
										placeholder="Enter your username"
									/>
								</FormGroup>
							</Col>
						</Row>
						<Row className="justify-content-center">
							<Col xs="5">
								<PasswordArea
									passwordStrength={this.state.passwordStrength}
									meter
									newPassword
									onChange={(ev) => {
										this.setState({password: ev.target.value});
										this.validatePassword(ev.target.value);
									}}
									value={this.state.password}
									placeholder="Enter your special, very secure password"
									small={
										<div>
											Your password must be <PasswordReq valid={!this.state.passwordTooShort}>{passwordMinLength}</PasswordReq> -{" "}
											<PasswordReq valid={!this.state.passwordTooLong}>{passwordMaxLength}</PasswordReq> characters long, and must not contain{" "}
											<PasswordReq valid={!this.state.passwordContainsControl}>control characters</PasswordReq> other than new line, or{" "}
											<PasswordReq valid={!this.state.passwordContainsEmoji}>emoji.</PasswordReq>
										</div>
									}
								></PasswordArea>
							</Col>
						</Row>
						<Row className="justify-content-center  mt-3">
							<Col xs="5">
								<FormGroup>
									<Form.Label>Select your gender:</Form.Label>
									<br />
									<Form.Check
										required
										id="gender-male"
										className="d-inline mr-2"
										onChange={(ev) => {
											this.setState({gender: 0});
										}}
										checked={this.state.gender === 0}
										custom
										type="radio"
										name="gender"
										label="Male"
									></Form.Check>
									<Form.Check
										required
										id="gender-female"
										custom
										onChange={(ev) => {
											this.setState({gender: 1});
										}}
										checked={this.state.gender === 1}
										className="d-inline mx-2"
										type="radio"
										name="gender"
										label="Female"
									></Form.Check>
									<Form.Check
										required
										id="gender-other"
										custom
										onChange={(ev) => {
											this.setState({gender: 2});
										}}
										checked={this.state.gender === 2}
										className="d-inline ml-2"
										type="radio"
										name="gender"
										label="Other"
									></Form.Check>
								</FormGroup>
							</Col>
						</Row>
						<Row className="justify-content-center">
							<Col xs="5">
								<FormGroup controlId="over18">
									<Form.Check
										custom
										type="checkbox"
										onChange={(ev) => {
											this.setState({nsfw: ev.target.checked});
										}}
										checked={this.state.nsfw}
										label="I am willing to see NSFW content, thus confirming that I am over the legal adulthood age in my country of living"
									></Form.Check>
								</FormGroup>
							</Col>
						</Row>
						{/* TEMPORARY */}
						<Row className="justify-content-center">
							<Col xs="5">
								<FormGroup controlId="status">
									<Form.Control
										size="lg"
										required
										onChange={(ev) => this.setState({status: ev.target.value})}
										value={this.state.status}
										type="text"
										placeholder="Choose a status to display"
									/>
								</FormGroup>
							</Col>
						</Row>
						<Row className="justify-content-center mt-3">
							<Col xs="5">
								<div style={{color: "red", marginBottom: "6px"}}>{this.state.error}</div>
								<Row className="justify-content-start">
									<Col xs="auto">
										<Button variant="primary shadow-none" type="submit">
											<div style={{width: "16ch"}}>
												{this.state.loading ? (
													<Spinner animation="border" size="sm" style={{width: "1.4rem", height: "1.4rem"}} />
												) : (
													<span>Create an account!</span>
												)}
											</div>
										</Button>
									</Col>
									<div className="my-auto">or</div>
									<Col xs="auto">
										<Button
											variant="success shadow-none"
											onClick={() => {
												this.props.history.push("/login");
											}}
											type="button"
										>
											<div style={{width: "8ch"}}>Log in</div>
										</Button>
									</Col>
								</Row>
							</Col>
						</Row>
					</Form>
				</Container>
			</div>
		);
	}
}

class PasswordReq extends Component {
	render() {
		return <span className={this.props.className + (this.props.valid ? " password-meets " : " password-not-meets")}>{this.props.children}</span>;
	}
}

export default withRouter(SignUpPage);
