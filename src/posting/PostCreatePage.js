import React, {Component} from "react";
import {Link, withRouter} from "react-router-dom";
import {Button, Container, Form, Row, Col, FormGroup, Spinner, Image} from "react-bootstrap";
import "./PostCreatePage.css";
import {FaImage} from "react-icons/fa";
import {makePost} from "../App";

class PostCreatePage extends Component {
	constructor() {
		super();

		this.state = {
			dragOver: false,
			errorUploading: false,

			header: null,
			headerProcessing: false,
			additionals: [],
			text: "",
			attachments: [],

			readyToPost: false,
		};

		this.previewHeader = this.previewHeader.bind(this);
		this.headerDropdown = this.headerDropdown.bind(this);
		this.submitPost = this.submitPost.bind(this);

		this.imageSelector = React.createRef();
	}

	previewHeader() {
		if (this.state.headerProcessing) {
			return <Spinner className="header-add-pic" animation="border" />;
		} else if (this.state.header) {
			return (
				<>
					<div
						onClick={(ev) => {
							// Prevents the file dialog from opening
							ev.stopPropagation();
							this.setState({header: null});
						}}
						className="header-clear-button"
					>
						x
					</div>
					<Image className="header-add-pic full" fluid src={this.state.header} />
				</>
			);
		} else {
			return <FaImage className="header-add-pic"></FaImage>;
		}
	}

	componentDidUpdate(p, prevState) {
		const anyChange =
			this.state.header !== prevState.header ||
			this.state.text !== prevState.text ||
			this.state.additionals !== prevState.additionals ||
			this.state.attachments !== prevState.attachments;
		const valid = this.state.header && this.state.text.length;
		if (anyChange) {
			this.setState({readyToPost: valid});
		}
	}

	headerDropdown() {
		return (
			<Row className="justify-content-between h-100">
				{this.state.header ? (
					<Col xs="12" className="text-center">
						<this.previewHeader />
					</Col>
				) : (
					<>
						<Col xs="3">
							<this.previewHeader />
						</Col>
						<Col xs="auto" className="my-auto">
							<div style={{color: this.state.errorUploading && "var(--navbar)"}} className="align-middle header-add-label">{this.state.errorUploading ? "Try a different image" : "Drag and drop your image here"}</div>
						</Col>
					</>
				)}
			</Row>
		);
	}

	additionals() {
		return (
			<Row className="justify-content-between h-100">
				<Col xs="12" className="my-auto text-center">
					Additionals +
				</Col>
			</Row>
		);
	}

	attachments() {
		return (
			<Row className="justify-content-between h-100">
				<Col xs="12" className="my-auto text-center">
					Attachments +
				</Col>
			</Row>
		);
	}

	submitPost(ev) {
		ev.preventDefault();
		console.log("Post state: ", this.state);

		this.setState({uploadingInProcess: true}, () => {
			const {header, text, additionals, attachments} = this.state;
			makePost(this.props.myName, header, additionals, text, attachments).then((ev) => {
				console.log(ev);
				this.setState({uploadingInProcess: false});
				this.props.history.push("/");
			});
		});
	}

	addImage(file) {
		const uploadError = () => {
			this.setState({dragOver: false, errorUploading: true});
		};
		if (!file.type) {
			uploadError();
		}
		const typeCheckReader = new FileReader();
		typeCheckReader.onload = (e) => {
			var arr = new Uint8Array(typeCheckReader.result).subarray(0, 4);
			var header = "";
			for (var i = 0; i < arr.length; i++) {
				header += arr[i].toString(16);
			}
			let type = "no-type";
			switch (header) {
				case "89504e47":
					type = "image/png";
					break;
				case "424d666e":
					type = "image/bmp";
					break;
				case "47494638":
					type = "image/gif";
					break;
				case "ffd8ffe0":
				case "ffd8ffe1":
				case "ffd8ffe2":
				case "ffd8ffe3":
				case "ffd8ffe8":
					type = "image/jpeg";
					break;
				default:
					type = "unknown"; // Or you can use the blob.type as fallback
					break;
			}
			console.log("Header type: ", type);
			if (type === "unknown") {
				uploadError();
				return;
			}

			/////

			const reader = new FileReader();
			reader.onload = (e) => {
				this.setState({errorUploading: false, dragOver: false, headerProcessing: false, header: reader.result});
			};
			reader.onerror = () => {
				uploadError();
			};
			this.setState({headerProcessing: true}, () => {
				reader.readAsDataURL(file);
			});
		};
		typeCheckReader.readAsArrayBuffer(file);
	}

	render() {
		return (
			<div className="content-container">
				<input
					ref={this.imageSelector}
					type="file"
					className="d-none position-fixed"
					onChange={(ev) => this.addImage(ev.target.files[0])}
					accept=".png, .jpg, .jpeg, .gif, .bmp"
				/>
				<Form onSubmit={this.submitPost}>
					<Container>
						<Row className="justify-content-center">
							<Col xs="6">
								<FormGroup controlId="header">
									<Form.Control
										onDragOver={(ev) => {
											ev.preventDefault();
											this.setState({
												dragOver: true,
											});
										}}
										onDragLeave={(ev) => {
											ev.preventDefault();
											if (ev.currentTarget === ev.target) {
												this.setState({
													dragOver: false,
												});
											}
										}}
										onDrop={(ev) => {
											ev.preventDefault();
											ev.persist();
											if (ev.dataTransfer.files.length) {
												this.addImage(ev.dataTransfer.files[0]);
											}
										}}
										onClick={(ev) => {
											this.imageSelector.current.click();
										}}
										as="div"
										required
										placeholder="Post content"
										className={"header-image-container " + (this.state.dragOver && "hover")}
									>
										<Container>
											<this.headerDropdown />
										</Container>
									</Form.Control>
								</FormGroup>
							</Col>
						</Row>
						<Row className="justify-content-center">
							<Col xs="6">
								<FormGroup controlId="additionals" className="mb-auto">
									<Form.Control as="div" className={"header-additionals-container"}>
										<Container>
											<this.additionals />
										</Container>
									</Form.Control>
								</FormGroup>
							</Col>
						</Row>
						<Row className="justify-content-center">
							<Col xs="6">
								<FormGroup controlId="attachments" className="mb-auto">
									<Form.Control as="div" className={"header-attachments-container"}>
										<Container>
											<this.attachments />
										</Container>
									</Form.Control>
								</FormGroup>
							</Col>
						</Row>
						<Row className="justify-content-center my-2">
							<Col xs="7">
								<hr />
							</Col>
						</Row>
						<Row className="justify-content-center">
							<Col xs="6">
								<FormGroup controlId="text">
									<Form.Control
										as="textarea"
										size="lg"
										onChange={(ev) => this.setState({text: ev.target.value})}
										value={this.state.text}
										type="text"
										placeholder="Post content"
										className="text-content"
									/>
								</FormGroup>
							</Col>
						</Row>
						<Row className="justify-content-center">
							<Col xs="6" className="text-right">
								<button disabled={!this.state.readyToPost} className="post-button" type="submit">
									{this.state.uploadingInProcess ? (
										<div style={{width: "2em"}}>
											<Spinner size="sm" style={{height: "1em", width: "1em"}} animation="border"></Spinner>
										</div>
									) : (
										"Post"
									)}
								</button>
							</Col>
						</Row>
					</Container>
				</Form>
			</div>
		);
	}
}

export default withRouter(PostCreatePage);

export class PostCreateButton extends Component {
	render() {
		return (
			<Row className="justify-content-center mb-3">
				<Col xs="10" className="text-center">
					<Link style={{textDecoration: "none"}} to="/create" className="w-100 d-block">
						<Button style={{backgroundColor: "var(--navbar)", borderColor: "var(--navbar)"}} variant="danger" size="lg" className="w-100 d-block">
							Create post!
						</Button>
					</Link>
				</Col>
			</Row>
		);
	}
}
