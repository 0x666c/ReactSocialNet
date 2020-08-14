package oneC;

import static oneC.Status.ERROR;
import static oneC.Status.EMPTY;
import static oneC.Status.FAILURE;
import static oneC.Status.SUCCESS;

import java.nio.file.StandardOpenOption;
import java.text.NumberFormat;
import java.util.Base64;
import java.util.Set;
import java.util.concurrent.ConcurrentMap;

import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.Timer;

import com.eclipsesource.json.Json;
import com.eclipsesource.json.JsonObject;
import com.eclipsesource.json.JsonValue;
import com.eclipsesource.json.PrettyPrint;
import com.eclipsesource.json.WriterConfig;
import com.google.common.collect.Lists;

import oneC.SessionScavenger.Session;
import spark.Filter;
import spark.Request;
import spark.Response;
import spark.Spark;

public class Main {

	public static long totalRequests = 0;

	private static final WriterConfig JSONPRINT = PrettyPrint.singleLine();

	private static DatabaseManager dbManager;
	private static MediaContentManager mediaManager;
	private static DatabaseHashMapImpl database;

	public static void main(String[] args) {
		// Initialise "users" database
		dbManager = new DatabaseManager("C:\\Users\\Jiftoo\\Desktop\\law_project_files\\1c\\1c\\db");
		dbManager.createDatabase("users", false);
		ConcurrentMap<String, UserData> users = dbManager.getOrMakeMap("users", "users");
		Set<String> fLogins = dbManager.getOrMakeSet("users", "fLogins");
		Set<String> fIP = dbManager.getOrMakeSet("users", "fIP");
		ConcurrentMap<String, Session> sessions = dbManager.getOrMakeMap("users", "sessions");
		Set<String> usedEmails = dbManager.getOrMakeSet("users", "usedEmails");

		// Initialise "posts" database
		dbManager.createDatabase("posts", false);
		ConcurrentMap<String, PostData> posts = dbManager.getOrMakeMap("posts", "posts");
		StringBuilder postKeypairs = new StringBuilder("Available posts: ");
		posts.forEach((k, v) -> postKeypairs.append(k+", "));
		System.out.println(postKeypairs);
		
		// Initialise "settigns" database
		dbManager.createDatabase("settings", false);
		ConcurrentMap<String, String> settings = dbManager.getOrMakeMap("settings", "settings");

		// Media manager
		mediaManager = new MediaContentManager("C:\\Users\\Jiftoo\\Desktop\\law_project_files\\1c\\1c\\db\\media");

		database = new DatabaseHashMapImpl(() -> users, () -> fLogins, () -> fIP, () -> sessions, () -> usedEmails, 3,
				5, () -> posts, () -> settings);

		// Default admin user
		database.addUser("0x666c@mail.ru", "admin", "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
				"I made this pepega platform!", Gender.MALE, true, "localhost");

		Spark.port(7777);

		// Routes

		// "Users" Route;
		// Add, check and remove accounts. Uses POST request method and accepts the
		// following json:
		// {
		//     request: <"login"|"register"|"remove"|"info"|"logout">
		//
		//     // Used with "login", "register", "remove".
		//     login: <user login>,
		//     password: <sha256 encrypted password>,
		//
		//     // Used by "login"
		//     publicPc: <true|false> // If true, session expires, otherwise lasts indefinitely
		//
		//	   // Used by "info"
		//     extended: <true|false> // Get public or public and private info
		// }
		//
		// Returns:
		// {
		//     // Used by "login", "register", "remove".
		//     error: <error message or null if success>
		//     // Used by "login"
		//     logged: <true|false>
		// }

		// admin/adminn

		Spark.post("/users", (req, resp) -> {
			System.out.println("/// Start user request ///");

			JsonObject json = (JsonObject) Json.parse(req.body());
			System.out.println("  Recieved: " + json.toString(JSONPRINT));

			final String request = json.getString("request", null);
			final String login = json.getString("login", "");
			final String password = json.getString("password", "");
			final boolean publicPc = json.getBoolean("publicPc", false);
			String session = req.cookie("session");

			System.out.println("  Type: " + request);
			System.out.println("  Old Session: " + session);

			if (request == null) {
				// "request" filed must be present with every request
				JsonObject response = Json.object();
				response.set("logged", false);
				response.set("error", "Malformed request, Try again later");
				return response.toString();
			}

			try {
				switch (request) {
				case "login":
					return login(req, resp, request, login, password, publicPc, session);
				case "register":
					final String email = json.getString("email", null);
					final Gender gender = Gender.getByIndex(json.getInt("gender", 0));
					final boolean nsfw = json.getBoolean("nsfw", false);
					final String pstatus = json.getString("status", "");
					return register(req, resp, request, email, login, password, pstatus, gender, nsfw);
				case "info":
					final boolean extended = json.getBoolean("extended", false);
					return info(req, resp, request, login, extended);
				case "ownUsername":
					return ownUsername(req, resp, request);
				case "logout":
					return logout(req, resp, request);
				default:
					JsonObject response = Json.object();
					response.set("logged", false);
					response.set("error", "Unknown request, Try again later");
					return response.toString();
				}
			} finally {
				System.out.println("/// End user request ///\n");
			}
		});

		// "Post" route;
		// Create, remove, or report a post. Uses POST request method and accepts the
		// following json:
		// {
		// // Used with "add", "remove", "flag", "get"
		// request: <"add"|"remove"|"flag|"get"">,
		// id: <post uuid> // Not with add
		// username: <author username>
		//
		// // Used with "add"
		// header: <base64 image>
		// additional: [<base64 image>, ...]
		// text: <string>
		// attachments: [<url>, ...]
		//
		//
		// // Used with "flag"
		// flag_note: <why the post was flagged or empty string>,
		// }
		//
		Spark.post("/post", (req, resp) -> {
			System.out.println("/// Start post request ///");
			System.out.println(req.body());

			JsonObject json = (JsonObject) Json.parse(req.body());
			System.out.println("  Recieved: " + json.toString(JSONPRINT));

			final String request = json.getString("request", null);
			final long postId = json.getLong("id", -1);
			final String username = json.getString("username", "");
			String session = req.cookie("session");

			System.out.println("  Type: " + request);
			System.out.println("  Session: " + session);

			if (request == null) {
				// "request" filed must be present with every request
				JsonObject response = Json.object();
				response.set("logged", false);
				response.set("error", "Malformed request, Try again later");
				return response.toString();
			}

			try {
				switch (request) {
				case "add":
					final String header = json.getString("header", "");
					// ???
					final JsonValue additionalJson = json.get("additional");
					final String[] additional = (additionalJson.isNull()) ? null
							: Lists.newArrayList(additionalJson.asArray()).toArray(new String[0]);
					final String text = json.getString("text", "");
					// ???
					final JsonValue attachmentsJson = json.get("attachments");
					final String[] attachments = (attachmentsJson.isNull()) ? null
							: Lists.newArrayList(attachmentsJson.asArray()).toArray(new String[0]);
					return addPost(req, resp, session, request, username, header, additional, text, attachments);
				case "get":
					return getPost(req, resp, postId);
				case "remove":
					// TODO
					return null;
				case "flag":
					// TODO
					return null;
				default:
					JsonObject response = Json.object();
					response.set("logged", false);
					response.set("error", "Unknown request, Try again later");
					return response.toString();
				}
			} finally {
				System.out.println("/// End post request ///\n");
			}
		});
		
		Spark.get("/availablePosts", (req, resp) -> {
			return posts.size();
		});

		// Static file routes

		// "Images" route;
		// Add, remove and fetch images. Uses GET request method and accepts the
		// following json:
		// {
		// id: <image uuid>,
		// thumb: <false|true>,
		// }
		//
		// View profile pictures

		// Delete this later
		//		Spark.get("/s/images/get", (req, resp) -> {
		//			final String user = req.queryParams("u");
		//			System.out.println("Requested image of " + user);
		//			if (user != null) {
		//				String hashedUsername = String.valueOf(user.hashCode());
		//				resp.type("image/png");
		//				return mediaManager.readImage("avatars", hashedUsername, "0");
		//			}
		//			return null;
		//		});
		
		Spark.get("/media/:folder/:file/:type", (req, resp) -> {
			System.out.println(123);
			final String folder = req.params("folder");
			final String file = req.params("file");
			final String type = req.params("type");
			System.out.println("Requested media: " + folder + "/" + file + "|" + type);
			resp.type("image/png");
			switch (type) {
			case "image":
				resp.type("image/png");
				return mediaManager.readImage(folder, file, null);
			case "file":
				return mediaManager.readFile(folder, file);
			case "post-image":
				final String[] split = folder.split("-");
				return mediaManager.readImageSubfolder(split[0], split[1], file, null);
			case "avatar":
				resp.type("image/png");
				return mediaManager.readImage(folder, String.valueOf(file.hashCode()), "0");
			}
			return null;
		});

		// Add/remove profile pictures
		// Format: {action: <add>, user: <username>, data: <base64 or undefined if 'remove'>}
		//		Spark.post("/s/images/post", (req, resp) -> {
		//			JsonObject json = (JsonObject) Json.parse(req.body());
		//			final String action = json.getString("action", null);
		//			final String username = json.getString("user", null);
		//			final String data = json.getString("data", null);
		//			JsonObject response = Json.object();
		//			System.out.println(action + " image of " + username);
		//			System.out.println("Data: " + data.substring(3, 40) + "...");
		//			switch (action) {
		//			case "add":
		//				mediaManager.saveImage("avatars", String.valueOf(username.hashCode()), data, true);
		//				break;
		//			default:
		//				// Not null
		//				response.set("error", "Error while uploading image");
		//			}
		//			return response.toString();
		//		});

		Spark.post("/media/add/:folder/:file/:type", (req, resp) -> {
			final String folder = req.params("folder");
			final String file = req.params("file");
			final String type = req.params("type");
			final byte[] media = req.bodyAsBytes();
			System.out.println("Saving media: " + folder + "/" + file + "|" + type);
			switch (type) {
			default:
				resp.status(403);
				return null;
			case "avatar":
				mediaManager.saveImage(folder, String.valueOf(file.hashCode()), media, StandardOpenOption.CREATE,
						StandardOpenOption.WRITE);
				return "ok";
			case "image":
				mediaManager.saveImage(folder, file, media, StandardOpenOption.CREATE,
						StandardOpenOption.WRITE);
				return "ok";
			case "file":
				mediaManager.saveFile(folder, file, Base64.getDecoder().decode(media), StandardOpenOption.CREATE,
						StandardOpenOption.WRITE);
				return "ok";
			}
		});

		// CORS Fuckery

		fixCORS();

		// Request counter:
		Spark.before((a, b) -> {
			if (!a.requestMethod().equals("OPTIONS")) {
				totalRequests++;
			}
		});

		// Just so i can do a graceful shutdown
		showGUI(users, sessions);
	}

	private static Object login(Request req, Response resp, String request, String login, String password,
			boolean publicPc, String session) {
		boolean validate = false;
		boolean forbidden = false;
		boolean nullCreds = false;
		Status status = FAILURE;
		// Prioritize the login/password 
		if (!login.equals("") && !password.equals("")) {
			// Can't both provide a cookie and login/password
			Object[] tuple = database.authUser(login, password, req.ip(), publicPc);
			status = (Status) tuple[0];
			session = (String) tuple[1];
		} else if (session != null) {
			// The user might have a valid session cookie
			status = database.validateUser(session, req.ip());
			if (status != SUCCESS) {
				resp.removeCookie("session");
				System.out.println("  Removed old cookie");
			}
		} else {
			status = ERROR;
			System.out.println("Unknown error");
		}
		System.out.println("  *New* Session: " + session);

		switch (status) {
		case SUCCESS:
			validate = true;
			break;
		case FAILURE:
			validate = false;
			break;
		case FORBIDDEN:
			forbidden = true;
			break;
		case ERROR:
			validate = false;
			nullCreds = true;
			break;
		default:
			Status.unexpectedStatus(status);
			validate = false;
		}

		String clientErrorMessage = null;
		if (validate) {
			System.out.printf("  User '%s' logged in from %s\n", login, req.ip());
			resp.cookie("/", "session", session, Integer.MAX_VALUE, false, false);
		} else if (forbidden) {
			System.out.printf("  Forbidden user '%s' tried to log in from %s\n", login, req.ip());
			clientErrorMessage = "You are forbidden from using this webisite.";
		} else if (nullCreds) {
			clientErrorMessage = "Please provide the username and the password";
		} else {
			System.out.printf("  User '%s' failed to log in from %s\n", login, req.ip());
			clientErrorMessage = "Incorrect username or password";
		}

		// Now create the response
		JsonObject response = Json.object();
		response.set("logged", validate && !forbidden);
		response.set("error", clientErrorMessage);

		System.out.println("  Sent: " + response.toString(JSONPRINT));
		return response.toString();
	}

	private static Object register(Request req, Response resp, String request, String email, String login,
			String password, String pstatus, Gender gender, boolean nsfw) {
		// Add checks later idk
		Status status = ERROR;

		status = database.addUser(email, login, password, pstatus, gender, nsfw, req.ip());

		JsonObject response = Json.object();
		switch (status) {
		case FORBIDDEN:
			System.out.printf("  Forbidden user '%s' was attempted to be created by %s\n", login, req.ip());
			response.set("error", "This username is forbidden or you were banned from using this website");
			break;
		case SUCCESS:
			System.out.printf("  User '%s' was created by %s\n", login, req.ip());
			break;
		case NOT_EMPTY:
			response.set("error", "This username is already taken!");
			System.out.printf("  User '%s' already exists, %s\n", login, req.ip());
			break;
		case NOT_EMPTY_2:
			response.set("error", "This email is used!");
			System.out.printf("  Email '%s' is already used, %s\n", email, req.ip());
			break;
		default:
			Status.unexpectedStatus(status);
		case ERROR:
			System.out.printf("  Error occured while '%s' was being created by %s\n", login, req.ip());
			response.set("error", "An unknown error occured");
			break;
		}

		System.out.println("  Sent: " + response.toString(JSONPRINT));
		return response.toString();
	}

	private static Object info(Request req, Response resp, String request, String login, boolean extended) {
		// Add checks later idk
		Status status = ERROR;

		UserData data = database.getUser(login);
		if (data != null)
			status = SUCCESS;

		JsonObject response = Json.object();
		switch (status) {
		default:
			Status.unexpectedStatus(status);
		case ERROR:
			System.out.printf("  Failed user data request %s, %s\n", login, req.ip());
			response.set("error", "This user's data cannot be requested");
			break;
		case SUCCESS:
			System.out.printf("  User data request %s, %s\n", login, req.ip());
			response.set("email", data.email);
			response.set("username", data.username);
			response.set("status", data.status);
			response.set("gender", data.gender.toString().toLowerCase());
			response.set("nsfw", data.nsfw);
			break;
		}

		System.out.println("  Sent: " + response.toString(JSONPRINT));
		return response.toString();
	}

	private static Object ownUsername(Request req, Response resp, String request) {
		Status status = ERROR;

		String cookie = req.cookie("session");
		String username = "";
		if (cookie == null) {
			status = FAILURE;
		} else {
			Session session = database.sessionScavenger.getSession(cookie);
			if (session == null) {
				status = FAILURE;
			} else {
				username = session.username;
				status = SUCCESS;
			}
		}

		JsonObject response = Json.object();
		switch (status) {
		default:
			Status.unexpectedStatus(status);
		case FAILURE:
			System.out.printf("  Failed username request %s, %s\n", cookie, req.ip());
			response.set("error", "Username cannot be requested");
			break;
		case SUCCESS:
			System.out.printf("  Username request %s, %s\n", cookie, req.ip());
			response.set("username", username);
			break;
		}

		System.out.println("  Sent: " + response.toString(JSONPRINT));
		return response.toString();
	}

	private static Object logout(Request req, Response resp, String request) {
		Status status = ERROR;

		String cookie = req.cookie("session");
		if (cookie == null) {
			status = FAILURE;
		} else {
			status = database.deauthUser(cookie, req.ip());
		}

		JsonObject response = Json.object();
		switch (status) {
		default:
			Status.unexpectedStatus(status);
		case FAILURE:
			System.out.printf("  Failed to logout %s, %s\n", cookie, req.ip());
			response.set("error", "Can't log out due to unexpected error");
			break;
		case SUCCESS:
			System.out.printf("  User %s logged out by %s\n", cookie, req.ip());
			break;
		case EMPTY:
			System.out.printf("  No session exists for %s, %s\n", cookie, req.ip());
			response.set("error", "You are not logged in");
			break;
		}

		System.out.println("  Sent: " + response.toString(JSONPRINT));
		return response.toString();
	}

	private static void fixCORS() {
		Spark.before((Filter) (r, response) -> {
			response.header("Access-Control-Allow-Origin", "http://217.15.202.178:3000"); // r.headers("Origin")
			response.header("Access-Control-Allow-Methods", "*");
			response.header("Access-Control-Allow-Credentials", "true");
		});

		Spark.options("/*", (req, res) -> {
			String accessControlRequestHeaders = req.headers("Access-Control-Request-Headers");
			if (accessControlRequestHeaders != null) {
				res.header("Access-Control-Allow-Headers", accessControlRequestHeaders);
			}

			String accessControlRequestMethod = req.headers("Access-Control-Request-Method");
			if (accessControlRequestMethod != null) {
				res.header("Access-Control-Allow-Methods", accessControlRequestMethod);
			}

			return "OK";
		});
	}

	private static void showGUI(ConcurrentMap<?, ?> userMap, ConcurrentMap<?, ?> sessionMap) {
		JFrame f = new JFrame("T Backend");
		f.setLayout(null);
		f.setAlwaysOnTop(true);
		f.setSize(300, 200);
		f.setDefaultCloseOperation(JFrame.DO_NOTHING_ON_CLOSE);
		f.setResizable(false);
		JButton stop = new JButton("Stop");
		stop.addActionListener(ev -> {
			System.out.println("Commiting and Releasing database...");
			dbManager.close();
			System.out.println("Exited!");
			System.exit(0);
		});
		stop.setBounds(95, 100, 95, 30);
		f.add(stop);

		JLabel heap = new JLabel();
		heap.setBounds(5, 3, 300, 20);
		f.add(heap);
		JLabel users = new JLabel();
		users.setBounds(5, 20, 300, 20);
		f.add(users);
		JLabel sessions = new JLabel();
		sessions.setBounds(5, 37, 300, 20);
		f.add(sessions);
		JLabel requests = new JLabel();
		requests.setBounds(5, 55, 300, 20);
		f.add(requests);
		JLabel posts = new JLabel();
		posts.setBounds(5, 73, 300, 20);
		f.add(posts);
		Timer t = new Timer(200, ev -> {
			Runtime r = Runtime.getRuntime();

			heap.setText("Heap: " + NumberFormat.getInstance().format(((r.totalMemory() - r.freeMemory()) / 1024))
					+ " KiB / " + NumberFormat.getInstance().format(r.totalMemory() / 1024) + " KiB");
			users.setText("Total users: " + userMap.size());
			sessions.setText("Open sessions: " + sessionMap.size());
			requests.setText("Total requests: " + totalRequests);
			posts.setText("Total posts: " + database.postAmount());
		});
		t.start();
		f.setLocationRelativeTo(null);
		f.setVisible(true);
	}

	private static Object addPost(Request req, Response resp, String cookie, String request, String username,
			String header, String[] additional, String text, String[] attachments) {
		Status status = ERROR;
		
		final int postId = database.reserverPostId();
		
		mediaManager.saveImage("posts/"+postId,"header", Base64.getDecoder().decode(header.split("base64,")[1]));
//		mediaManager.saveImage("posts/"+postId,"attachment0,1...", Base64.getDecoder().decode(header));
		
		
		final PostData post = new PostData(username, 0, text, null, System.currentTimeMillis(),
				String.valueOf(postId));
		status = database.makePost(cookie, req.ip(), username, post);

		JsonObject response = Json.object();
		switch (status) {
		default:
			Status.unexpectedStatus(status);
		case FAILURE:
			System.out.printf("  Failed to make post %s, %s\n", username, req.ip());
			response.set("error", "Failed to post due to unexpected error");
			break;
		case SUCCESS:
			// postId changes inside makePost() as a side effect
			System.out.printf("  User %s posted  id: %s\n", username, post.postId);
			break;
		}

		System.out.println("  Sent: " + response.toString(JSONPRINT));
		return response.toString();
	}

	private static Object getPost(Request req, Response resp, long id) {
		Status status = FAILURE;
		JsonObject response = Json.object();
		
		// Current settings don't allow ids below 1, but ill leave it like this.
		if (id > -1) {
			final PostData post = database.getPost(id);
			if (post != null) {
				response.set("author", post.author);
				//response.set("header", post.header);
				response.set("additional", post.additional);
				response.set("text", post.text);
				if (post.attachments != null)
					response.set("attachments", Json.array(post.attachments));
				else {
					response.set("attachments", Json.array());
				}
				response.set("date", post.date);
				response.set("postId", post.postId);
				status = SUCCESS;
			}
			status = EMPTY;
		}

		switch (status) {
		default:
			Status.unexpectedStatus(status);
		case FAILURE:
			System.out.printf("  Failed to request post id: %s, %s\n", id, req.ip());
			response.set("error", "Failed to request post "+id+" due to unexpected error");
			break;
		case EMPTY:
			System.out.printf("  Post %s does not exist; %s\n", id, req.ip());
			response.set("error", "Post "+id+" does not exist");
			break;
		case SUCCESS:
			System.out.printf("  Requested post id: %s by %s\n", id, req.ip());
			break;
		}

		System.out.println("  Sent: " + response.toString(JSONPRINT));
		return response.toString();
	}

}