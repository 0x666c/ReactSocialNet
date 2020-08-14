import React, {Component} from "react";
import {Image} from "react-bootstrap";
import {FaQuestionCircle, FaSignOutAlt, FaUser, FaAlignJustify} from "react-icons/fa";
import {withRouter} from "react-router";
import {getAvatarImage, logout} from "../App";
import "./ProfileIcon.css";
import ClickAwayListener from "react-click-away-listener";

class ProfileIcon extends Component {
	constructor(props) {
		super();

		this.state = {
			expanded: false,
			icon: null,
		};

		this.profilePopout = this.profilePopout.bind(this);
		this.profileHeader = this.profileHeader.bind(this);
		this.profileItem = this.profileItem.bind(this);
		this.separator = this.separator.bind(this);
		this.logout = this.logout.bind(this);
        this.toProfile = this.toProfile.bind(this);
        this.toChangelog = this.toChangelog.bind(this);
	}

	async componentDidMount() {
		const url = await getAvatarImage(this.props.userData.username);
		this.setState({
			icon: <Image onClick={() => this.setState({expanded: !this.state.expanded})} className="profile-icon" src={url} />,
		});
	}

	hidePopup() {
		this.setState({
			expanded: false,
		});
	}

	async logout() {
		if (await logout()) {
			document.location.reload();
		}
	}

	toProfile() {
		this.props.history.push(`/p${this.props.userData.username}`);
    }
    
    toChangelog() {
		this.props.history.push(`/changelog`);
	}

	separator() {
		return <div className="separator"></div>;
	}

	profileHeader() {
		return (
			<div className="profile-header d-flex justify-content-between">
				<div style={{pointerEvents: "none"}}>{this.state.icon}</div>
				<div>{this.props.userData.username}</div>
			</div>
		);
	}

	profileItem({text, icon, onClick}) {
		return (
			<div
				className="profile-item"
				onClick={() => {
                    this.hidePopup();
					try {
                        onClick();
                    } catch(e) {}
				}}
			>
				<div>{icon()}</div>
				<div>{text}</div>
			</div>
		);
	}

	profilePopout() {
		if (this.state.expanded) {
			return (
				<ClickAwayListener
					onClickAway={() => {
						this.setState({expanded: false});
					}}
				>
					<div className="profile-menu">
						<this.profileHeader />
						{this.separator()}
						<this.profileItem text="Profile" icon={FaUser} onClick={this.toProfile} />
						<this.profileItem text="Support" icon={FaQuestionCircle} />
						<this.profileItem text="Changelog" icon={FaAlignJustify} onClick={this.toChangelog} />
						{this.separator()}
						<this.profileItem text="Log out" icon={FaSignOutAlt} onClick={this.logout} />
					</div>
				</ClickAwayListener>
			);
		}
		return null;
	}

	render() {
		return (
			<div className="profile-container">
				{this.state.icon}
				<this.profilePopout />
			</div>
		);
	}
}

export default withRouter(ProfileIcon);
