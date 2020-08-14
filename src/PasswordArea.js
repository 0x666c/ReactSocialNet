import React, {Component} from "react";
import {FormGroup, Form} from "react-bootstrap";
import PasswordBlur from "./signUpPage/PasswordBlur";

export default class PasswordArea extends Component {
	render() {
		return (
			<FormGroup controlId="password" className="mb-1">
				{this.props.meter && (
					<div className="password-meter">
						<div className={"password-meter-bar " + this.props.passwordStrength}></div>
					</div>
				)}
				<PasswordBlur>
					<Form.Control
						as="textarea"
						size="lg"
						required
						autoComplete={this.props.newPassword ? "new-password" : ""}
						onChange={this.props.onChange}
						value={this.props.value}
						type="password"
						placeholder={this.props.placeholder}
						className={"password-field " + (this.props.meter ? "corners" : undefined)}
					/>
				</PasswordBlur>
				<small>{this.props.small}</small>
			</FormGroup>
		);
	}
}
