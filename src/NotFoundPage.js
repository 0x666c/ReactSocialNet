import React, {Component} from "react";
import { Link } from "react-router-dom";

export default class NotFoundPage extends Component {
	render() {
		return (
			<>
				<div className="content-container display-1 text-center pt-5 mb-n4">Not found!</div>
				<Link to="/" className="d-block content-container text-center" style={{fontSize: "18px"}}>Go back to main page</Link>
			</>
		);
	}
}
