import React, {Component} from "react";
import "./PasswordBlur.css";
import { Form, FormGroup } from "react-bootstrap";

export default class PasswordBlur extends Component {
	constructor() {
		super();

		this.state = {
			blur: false,
		};
	}
	render() {
		return (
			<div className={this.state.blur ? "password-blur" : undefined}>
				{this.props.children}
				<div className="password-blur-checkbox-container">
					<FormGroup controlId="blur-checkbox">
						<Form.Check
							custom
							type="checkbox"
							checked={this.state.blur}
							onChange={(ev) =>
								this.setState({
									blur: ev.target.checked,
								})
							}
							label="Blur password field"
						></Form.Check>
					</FormGroup>
				</div>
			</div>
		);
	}
}
