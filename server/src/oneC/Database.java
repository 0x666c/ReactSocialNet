package oneC;

public interface Database {

	// ----------------------- USERS ----------------------- //

	// Control forbidden usernames
	public Status addForbiddenLogin(String login);

	public Status removeForbiddenLogin(String login);

	public Status checkForbiddenLogin(String login);

	// Control blocket ip addresses
	public Status addBlockedIP(String ip);

	public Status removeBlockedIP(String ip);

	public Status checkBlockedIP(String ip);

	// Create an account
	public Status addUser(String email, String login, String password, String status, Gender gender, boolean nsfw,
			String ip);

	public Status deauthUser(String uuid, String ip);

	// Check if user can auth using their session cookie
	public Status validateUser(String uuid, String ip);

	// Start a session with an id, bound to ip, which expires in a certain amount of time
	public Object[] authUser(String login, String password, String ip, boolean publicPc);

	// Get user account data
	public UserData getUser(String login);

	// Delete user account
	public Status removeUser(String login, String ip);

	// ----------------------- POSTS ----------------------- //

	public Status makePost(String uuid, String ip, String username, PostData post);
	
	public PostData getPost(long id);

	public Status removePost(String uuid, String ip, String username, long postId);

	public Status editPost(String uuid, String ip, String username, long postId, PostData post);

}