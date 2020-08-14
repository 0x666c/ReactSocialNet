package oneC;

import java.io.Serializable;
import java.util.Collection;
import java.util.Iterator;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

public class SessionScavenger {

	private final Object LOCK = new Object();

	private Thread scavengeThread;
	private volatile boolean paused = false;

	// <UUID, Session>
	private ConcurrentMap<String, Session> sessions;
	private int periodMs;

	public SessionScavenger(Supplier<ConcurrentMap<String, Session>> scavengerMapFactory, int periodSeconds) {
		try {
			this.periodMs = Math.toIntExact(TimeUnit.MILLISECONDS.convert(periodSeconds, TimeUnit.SECONDS));
		} catch (Exception e) {
			System.err.printf(
					"Value of '%d' seconds overflows 32bit when converted to milliseconds. Instead set to INT_MAX");
			this.periodMs = Integer.MAX_VALUE;
		}
//		sessions = new ConcurrentHashMap<>();
		sessions = scavengerMapFactory.get();

		scavengeThread = new Thread(this::scavenge, "Session-Scavenger");
		scavengeThread.start();
	}

	private void scavenge() {
		synchronized (LOCK) {
			Collection<Session> sessionValues = sessions.values();
			for (Iterator<Session> iterator = sessionValues.iterator(); iterator.hasNext();) {
				Session removalCandidate = iterator.next();
				if (removalCandidate.isExpired()) {
					System.out.println("Removed expired session: " + removalCandidate.uuid + "|" + removalCandidate.IP);
					iterator.remove();
				}
			}
		}
		try {
			Thread.sleep(periodMs);
		} catch (InterruptedException e) {
			e.printStackTrace(); // Why??
		}

		while (paused) {
			try {
				Thread.sleep(300);
			} catch (InterruptedException e) {
				e.printStackTrace(); // Why??
			}
		}
	}

	public void addNewSession(String username, String uuid, String ip, long expireTimeMinutes, boolean expires) {
		synchronized (LOCK) {
			sessions.put(uuid, new Session(username, ip, uuid, System.currentTimeMillis(), expireTimeMinutes, expires));
		}
	}
	
	public Session getSession(String uuid) {
		synchronized (LOCK) {
			return sessions.get(uuid);
		}
	}

	public boolean removeSession(String uuid) {
		synchronized (LOCK) {
			return sessions.remove(uuid) != null;
		}
	}

	// Return session or null
	public Session isSessionPresent(String uuid) {
		synchronized (LOCK) {
			return sessions.get(uuid);
		}
	}

	public void setPaused(boolean isPaused) {
		paused = isPaused;
	}

	public static class Session implements Serializable {
		private static final long serialVersionUID = 6884369824790114062L;
		
		public final String username, IP, uuid;
		public final long creationTimeEpochMillis, expireTimeMinutes;
		public boolean expires;

		public Session(String username, String IP, String uuid, long creationTimeEpochMillis, long expireTimeMinutes,
				boolean expires) {
			this.username = username;
			this.IP = IP;
			this.uuid = uuid;
			this.creationTimeEpochMillis = creationTimeEpochMillis;
			this.expireTimeMinutes = expireTimeMinutes;
			this.expires = expires;
		}

		public boolean isExpired() {
			if (!expires)
				return false;
			return ((creationTimeEpochMillis + TimeUnit.MILLISECONDS.convert(expireTimeMinutes, TimeUnit.MINUTES))
					- System.currentTimeMillis()) <= 0;
		}

	}

}