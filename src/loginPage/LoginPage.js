import Cookies from "js-cookie";
import React, {Component} from "react";
import {Button, Col, Container, Form, FormGroup, Row, Spinner} from "react-bootstrap";
import {withRouter} from "react-router";
import {signWithPassword} from "../App.js";
import "./LoginPage.css";
import PasswordArea from "../PasswordArea.js";

class LoginPage extends Component {
	constructor() {
		super();

		this.state = {
			login: "",
			password: "",
			publicPc: false,
			loading: false,

			passed: null,
			error: null,
		};
	}

	render() {
		return (
			<div className="content-container">
				<Container className="pb-3">
					<Row className="justify-content-center">
						<Col xs="12" className="text-center display-1">
							Welcome{Cookies.get("session") ? <> back!</> : <>!</>}
						</Col>
					</Row>
				</Container>
				<Container className="mt-3">
					<Form
						method="POST"
						onSubmit={(ev) => {
							ev.preventDefault();
							this.setState(
								{
									loading: true,
								},
								() => {
									signWithPassword(this.state.login, this.state.password, this.state.publicPc).then((response) => {
										this.setState({
											passed: response.logged,
											error: response.error,
											loading: false,
										});
										if (response.logged) {
											this.props.history.replace("/");
										}
									});
								}
							);
						}}
					>
						<Row className="justify-content-center">
							<Col xs="5">
								<FormGroup controlId="login">
									<Form.Control
										size="lg"
										required
										onChange={(ev) => this.setState({login: ev.target.value})}
										value={this.state.login}
										autoComplete="off"
										type="text"
										placeholder="Username"
									/>
								</FormGroup>
							</Col>
						</Row>
						<Row className="justify-content-center">
							<Col xs="5">
								<PasswordArea onChange={(ev) => this.setState({password: ev.target.value})} value={this.state.password} placeholder="Password"></PasswordArea>
								<FormGroup controlId="publicpc">
									<Form.Check
										custom
										type="checkbox"
										checked={this.state.publicPc}
										onChange={(ev) => this.setState({publicPc: ev.target.checked})}
										label="This is a public computer"
									></Form.Check>
								</FormGroup>
								<span className="form-text text-danger">{this.state.error}</span>
							</Col>
						</Row>
						<Row className="justify-content-center mt-2">
							<Col xs="5">
								<Row className="justify-content-start">
									<Col xs="auto">
										<Button variant="primary shadow-none" type="submit">
											<div style={{width: "7ch"}}>
												{this.state.loading ? <Spinner animation="border" size="sm" style={{width: "1.4rem", height: "1.4rem"}} /> : <span>Log in</span>}
											</div>
										</Button>
									</Col>
									<div className="my-auto">or</div>
									<Col xs="auto">
										<Button
											variant="success shadow-none"
											type="button"
											onClick={() => {
												this.props.history.push("/signup");
											}}
										>
											<div style={{width: "8ch"}}>Sign up</div>
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

export default withRouter(LoginPage);
