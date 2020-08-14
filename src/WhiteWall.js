import React, {Component} from "react";
import {Spinner} from "react-bootstrap";

export default class WhiteWall extends Component {
	render() {
		return (
			<div className={"white-wall " + (this.props.show ? "show" : "hide")}>
				<Spinner className="white-wall-indicator" animation="grow" />
			</div>
		);
	}
}
