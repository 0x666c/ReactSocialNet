import React, {Component} from "react";
import {Container} from "react-bootstrap";
import Post from "./Post";
import {PostCreateButton} from "./PostCreatePage";
import "./Posting.css";
import {getAvailablePosts} from "../App";

export default class FeedPage extends Component {
	constructor() {
		super();

		this.state = {
			posts: [],
		};
	}

	async componentDidMount() {
		this.setState({posts: Array.from({length: await getAvailablePosts()}, Number.call, (i) => i + 1).reverse()});
	}

	render() {
		return (
			<div className="content-container">
				<Container className="feed-container">
					<PostCreateButton />
					{this.state.posts.map((p) => {
						return <Post key={p} id={p}></Post>;
					})}
				</Container>
			</div>
		);
	}
}
