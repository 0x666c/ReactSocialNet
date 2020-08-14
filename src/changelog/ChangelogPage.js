import React, {Component} from "react";
import { Container, Row, Col } from "react-bootstrap";

export default class ChangelogPage extends Component {
	render() {
		return (
			<div className="content-container">
				<Container className="">
					<Row className="justify-content-center">
						<Col xs="12" className="text-center display-4 changelog-header">Version 0.0.1</Col>
						<Col xs="12" className="text-center changelog-line">Added some crap</Col>
                        <Col xs="12" className="text-center changelog-line">Added some more crap</Col>
					</Row>
				</Container>
			</div>
		);
	}
}
