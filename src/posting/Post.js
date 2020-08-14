import dateFormat from "dateformat";
import React, { Component } from "react";
import { Col, Container, Image, Row } from "react-bootstrap";
import Scrollbars from "react-custom-scrollbars";
import { withRouter } from "react-router";
import { getAvatarImage, getPost, getPostHeaderLink } from "../App";

class Post extends Component {
	constructor(props) {
		super();

		this.state = {
			header: null,
			additional: [],
			text: null,
			likes: 69,
			author: null,
			date: null,
			id: props.id,
		};

		this.goToProfile = this.goToProfile.bind(this);
		this.additionalImages = this.additionalImages.bind(this);
	}

	async componentDidMount() {
		const post = await getPost(this.state.id);
		console.log(post);
		// const arr = Array.from({length: post.additional}).map((a, i) => {
		// 	return getPostAdditional(post.postId, i);
		// });
		// console.log(arr);
		this.setState({
			author: post.author,
            text: post.text,
            date: post.date,
            // header: await getPostHeader(post.postId),
            header: getPostHeaderLink(post.postId),
			additional: [],
			avatar: await getAvatarImage(post.author),
		});
	}

	goToProfile() {
		this.props.history.push(`/p${this.state.author}`);
	}

	formatPostDate() {
		return this.state.date === null ? "" : dateFormat(new Date(this.state.date), "mmmm dS yyyy, h:MM");
	}

	additionalImages() {
		if (this.state.additional.length) {
			return (
				// Good enough for now
				<Scrollbars
					className="post-additional-scroll"
					autoHeight
					hideTracksWhenNotNeeded
					renderThumbHorizontal={({style, ...props}) => (
						<div {...props} style={{backgroundColor: "white", border: "2px solid black", borderRadius: "6px", ...style}}></div>
					)}
					renderView={({style, ...props}) => <div {...props} style={{paddingBottom: "12px", ...style}}></div>}
				>
					{this.state.additional &&
						this.state.additional.map((item, i) => {
							return (
								<div key={i} className="post-additional-image">
									{item}
								</div>
							);
						})}
				</Scrollbars>
			);
        }
        return null;
	}

	render() {
		return (
			<Row className="post-wrapper">
				<Container fluid className="post">
					<Row className="post-main-image">
						<Col style={{padding: "1px"}} xs="12">
							<Image fluid src={this.state.header}></Image>
						</Col>
					</Row>
					{/* <Row className="post-additional-wrapper">
						<Col xs="12">
							<this.additionalImages />
						</Col>
					</Row> */}
				</Container>
				<Col xs="12" className="post-additional-wrapper">
					<this.additionalImages />
				</Col>
				<Col xs="12" className="post-text">
					{this.state.text}
				</Col>
				<Col xs="12" className="post-info-container d-flex">
					<div className="post-info-icon" onClick={this.goToProfile}>
						<Image fluid src={this.state.avatar}></Image>
					</div>
					<div className="post-info-namedate d-flex flex-column">
						<span onClick={this.goToProfile}>
							<span className="post-info-name">{this.state.author}</span>
						</span>
						<span className="post-info-date">{this.formatPostDate()}</span>
					</div>
				</Col>
			</Row>
		);
	}
}

export default withRouter(Post);
