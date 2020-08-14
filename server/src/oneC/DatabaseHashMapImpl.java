package oneC;

import static oneC.Status.EMPTY;
import static oneC.Status.ERROR;
import static oneC.Status.FAILURE;
import static oneC.Status.FORBIDDEN;
import static oneC.Status.NOT_EMPTY;
import static oneC.Status.NOT_EMPTY_2;
import static oneC.Status.SUCCESS;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentMap;
import java.util.function.Supplier;

import oneC.SessionScavenger.Session;

public class DatabaseHashMapImpl implements Database {

	private final ConcurrentMap<String, UserData> users;
	private final Set<String> forbiddenLogins, blockedIPs, usedEmails;
	public final int minLoginLength, minPasswordLength;

	private final ConcurrentMap<String, PostData> posts;
	
	private final ConcurrentMap<String, String> settings;

	public SessionScavenger sessionScavenger;
	
	private volatile int nextPostId;

	public DatabaseHashMapImpl(Supplier<ConcurrentMap<String, UserData>> userMapFactory,
			Supplier<Set<String>> loginpSetFactory, Supplier<Set<String>> ipSetFactory,
			Supplier<ConcurrentMap<String, Session>> scavengerMapFactory, Supplier<Set<String>> usedEmailSetFactory,
			int minLoginLength, int minPasswordLength, Supplier<ConcurrentMap<String, PostData>> postsMapFactory, Supplier<ConcurrentMap<String, String>> settingMapFactory) {

		//		users = new ConcurrentHashMap<>();
		//		forbiddenLogins = ConcurrentHashMap.newKeySet();
		//		blockedIPs = ConcurrentHashMap.newKeySet();

		users = userMapFactory.get();
		forbiddenLogins = loginpSetFactory.get();
		blockedIPs = ipSetFactory.get();
		usedEmails = usedEmailSetFactory.get();

		this.minLoginLength = minLoginLength;
		this.minPasswordLength = minPasswordLength;

		posts = postsMapFactory.get();
		
		settings = settingMapFactory.get();
		
		nextPostId = Integer.valueOf(settings.getOrDefault("nextPostId", "0"));

		sessionScavenger = new SessionScavenger(scavengerMapFactory, 30);
	}

	@Override
	public Status addUser(String email, String login, String password, String status, Gender gender, boolean nsfw,
			String ip) {
		if (nullCheck(login, password, ip)) {
			return ERROR;
		}

		if (checkBlockedIP(ip) == SUCCESS || checkForbiddenLogin(login) == SUCCESS) {
			return FORBIDDEN;
		}

		if (users.containsKey(login)) {
			return NOT_EMPTY;
		}
		if (usedEmails.contains(email)) {
			return NOT_EMPTY_2;
		}
		UserData d = new UserData(email, login, password, status, gender, nsfw);
		System.out.println(d);
		users.put(login, d);
		usedEmails.add(email);
		return SUCCESS;
	}

	@Override
	public Status validateUser(String uuid, String ip) {
		if (nullCheck(uuid, ip)) {
			return ERROR;
		}

		if (checkBlockedIP(ip) == SUCCESS) {
			return FORBIDDEN;
		}

		final SessionScavenger.Session session = sessionScavenger.isSessionPresent(uuid);
		if (session != null && session.uuid.equals(uuid) && session.IP.equals(ip)) {
			return SUCCESS;
		}
		return FAILURE;
	}

	// Might do something about it
	public Status validateUsername(String uuid, String ip, String username) {
		if (nullCheck(uuid, ip)) {
			return ERROR;
		}

		if (checkBlockedIP(ip) == SUCCESS) {
			return FORBIDDEN;
		}

		final SessionScavenger.Session session = sessionScavenger.isSessionPresent(uuid);
		if (session != null && session.uuid.equals(uuid) && session.IP.equals(ip)
				&& session.username.equals(username)) {
			return SUCCESS;
		}
		return FAILURE;
	}

	@Override
	// Don't want to make a tuple class, instead will use a hack ;)
	public Object[] authUser(String login, String password, String ip, boolean publicPc) {
		final Object[] tuple = { FAILURE, null };

		if (nullCheck(login, password, ip)) {
			tuple[0] = ERROR;
			return tuple;
		}

		if (checkBlockedIP(ip) == SUCCESS) {
			tuple[0] = FORBIDDEN;
			return tuple;
		}

		UserData user = users.get(login);
		System.out.println(user);
		if (user != null) {
			String validPassword = user.password;
			if (!validPassword.equals(password)) {
				return tuple;
			}

			// If alright, create a new session
			String uuid = UUID.randomUUID().toString();
			sessionScavenger.addNewSession(login, uuid, ip, publicPc ? 10 : 0, publicPc);
			tuple[0] = SUCCESS;
			tuple[1] = uuid;

			return tuple;
		}
		return tuple;
	}

	public Status deauthUser(String uuid, String ip) {
		if (checkBlockedIP(ip) == SUCCESS) {
			return FORBIDDEN;
		}
		return sessionScavenger.removeSession(uuid) ? SUCCESS : EMPTY;
	}

	@Override
	public Status removeUser(String login, String ip) {
		if (nullCheck(login, ip)) {
			return ERROR;
		}

		if (checkBlockedIP(ip) == SUCCESS) {
			return FORBIDDEN;
		}

		UserData removedData = users.remove(login);
		if (removedData == null) {
			return FAILURE;
		} else {
			usedEmails.remove(removedData.email);
			return SUCCESS;
		}
	}

	@Override
	public UserData getUser(String login) {
		if (nullCheck(login)) {
			return null;
		}
		return users.get(login);
	}

	// ----------------------------------------------------------------------------------------

	@Override
	public Status checkForbiddenLogin(String login) {
		return (forbiddenLogins.contains(login) || (login.length() < minLoginLength)) ? SUCCESS : FAILURE;
	}

	@Override
	public Status checkBlockedIP(String ip) {
		return blockedIPs.contains(ip.toString()) ? SUCCESS : FAILURE;
	}

	// ----------------------------------------------------------------------------------------

	@Override
	public Status addForbiddenLogin(String login) {
		if (users.containsKey(login))
			return NOT_EMPTY;
		return forbiddenLogins.add(login) ? SUCCESS : FAILURE;
	}

	@Override
	public Status removeForbiddenLogin(String login) {
		return forbiddenLogins.remove(login) ? SUCCESS : FAILURE;
	}

	@Override
	public Status addBlockedIP(String ip) {
		return (blockedIPs.add(ip.toString())) ? SUCCESS : FAILURE;
	}

	@Override
	public Status removeBlockedIP(String ip) {
		return blockedIPs.remove(ip.toString()) ? SUCCESS : FAILURE;
	}

	private static boolean nullCheck(Object... objects) {
		for (int i = 0; i < objects.length; i++) {
			if (objects[i] == null)
				return true;
		}
		return false;
	}

	@Override
	public Status makePost(String uuid, String ip, String username, PostData post) {
		Status ev = validateUsername(uuid, ip, username);
		if (ev == SUCCESS) {
			posts.put(post.postId, post);
			return SUCCESS;
		}
		return FAILURE;
	}

	@Override
	public PostData getPost(long id) {
		// Probably should add privateness and some other checks later
		return posts.get(String.valueOf(id));
	}

	@Override
	public Status removePost(String uuid, String ip, String username, long postId) {
		return null;
	}

	@Override
	public Status editPost(String uuid, String ip, String username, long postId, PostData post) {
		return null;
	}
	
	public int reserverPostId() {
		nextPostId += 1;
		settings.put("nextPostId", String.valueOf(nextPostId));
		return nextPostId;
	}

	public int postAmount() {
		return posts.size();
	}

}