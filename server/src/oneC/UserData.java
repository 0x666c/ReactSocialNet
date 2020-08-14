package oneC;

import java.io.Serializable;

public class UserData implements Serializable {
	private static final long serialVersionUID = 8370403409842932697L;

	public final String email, username, password, status;
	public final Gender gender;
	public final boolean nsfw;

	public UserData(String email, String username, String password, String status, Gender gender, boolean nsfw) {
		this.email = email;
		this.username = username;
		this.password = password;
		this.status = status;
		this.gender = gender;
		this.nsfw = nsfw;
	}
	
	@Override
	public String toString() {
		return email + " '" + username + "' '" + password + "' " + status + " " + gender + " " + nsfw;
	}
}